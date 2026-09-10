/**
 * The payment step must offer exactly ONE payment submission control.
 *
 * It used to show two buttons both reading "Pay": one above the Stripe fields
 * that only created the PaymentIntent (charging nothing, and redundant because
 * a useEffect already did that on mount), and the real submit below them. Two
 * controls reading "Pay" on a checkout is how a card gets entered twice.
 *
 * These assertions are structural on purpose — the page is a client component
 * wired to Stripe Elements, which cannot be mounted here without a browser and
 * a live publishable key. No payment is issued by this file.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const raw = readFileSync("app/reserve/[id]/payment/page.tsx", "utf8");
/** Comments explain the fix and quote the old markup; they are not controls. */
const stripComments = (src: string) =>
  src.replace(/\{\/\*[\s\S]*?\*\/\}/g, "").replace(/\/\*[\s\S]*?\*\//g, "");
const page = stripComments(raw);

/** The page splits into the PaymentForm component and the page component. */
const formSource = page.slice(
  page.indexOf("function PaymentForm"),
  page.indexOf("const formatCurrency")
);
const pageSource = page.slice(page.indexOf("export default function PaymentPage"));
/** Everything the customer sees in production — the dev-only block removed. */
const productionSource = page.replace(
  /\{process\.env\.NODE_ENV === 'development' && \([\s\S]*?\n {10}\)\}/,
  ""
);

describe("exactly one payment submission control", () => {
  it("has a single type=\"submit\"", () => {
    const submits = page.match(/type="submit"/g) ?? [];
    assert.equal(submits.length, 1, `found ${submits.length} submit controls`);
  });

  it("that submit lives inside the Stripe form", () => {
    assert.match(formSource, /type="submit"/);
    assert.match(formSource, /<form onSubmit=\{handleSubmit\}/);
  });

  it("the page body no longer renders a Pay button of its own", () => {
    assert.doesNotMatch(pageSource, /onClick=\{handlePayment\}/, "the upper Pay button is gone");
  });

  it("the now-dead handler that backed it is removed", () => {
    assert.doesNotMatch(raw, /const handlePayment = async \(\) => \{/,
      "it only initialised the intent; the effect already does that");
    assert.match(raw, /const handlePaymentSuccess = async/,
      "confirmation handling must be preserved");
  });

  it("no production control other than the one submit says Pay", () => {
    const payLabels = (productionSource.match(/`Pay \$\{|>\s*Pay\b/g) ?? []);
    assert.equal(payLabels.length, 1,
      `production shows ${payLabels.length} controls labelled Pay`);
  });

  it("the dev-only test-payment control is compiled out of production", () => {
    assert.match(page, /process\.env\.NODE_ENV === 'development'/,
      "the test-payment button must stay behind the dev check");
    assert.doesNotMatch(productionSource, /Test payment/);
  });
});

describe("the submit names the amount being charged", () => {
  it("is labelled with the formatted total", () => {
    assert.match(formSource, /`Pay \$\{totalLabel\}`/);
  });

  it("receives that total from the page's own cost breakdown", () => {
    assert.match(pageSource, /totalLabel=\{formatCurrency\(costBreakdown\.total \|\| 0\)\}/,
      "same figure as the order summary and the amount sent to Stripe");
  });
});

describe("order summary sits above the Stripe fields", () => {
  it("summary is rendered before the payment section", () => {
    const summary = pageSource.indexOf("Order summary");
    const fields = pageSource.indexOf("<StripeProvider");
    assert.ok(summary > -1 && fields > -1);
    assert.ok(summary < fields, "the customer reads what they owe before entering a card");
  });

  it("the total due is still shown in the summary", () => {
    assert.match(pageSource, /Total due/);
    assert.match(pageSource, /formatCurrency\(costBreakdown\.total \|\| 0\)/);
  });
});

describe("submission is blocked while processing", () => {
  it("disables the button on processing, missing Stripe, or an unmet minimum", () => {
    assert.match(formSource, /disabled=\{!stripe \|\| isProcessing \|\| !bottleRequirement\.met\}/);
  });

  it("shows a busy state rather than a silent second press", () => {
    assert.match(formSource, /loading=\{isProcessing\}/);
    assert.match(formSource, /'Processing…'/);
  });

  it("sets processing before awaiting Stripe and clears it in finally", () => {
    const submit = formSource.slice(formSource.indexOf("const handleSubmit"));
    assert.ok(
      submit.indexOf("setIsProcessing(true)") < submit.indexOf("stripe.confirmPayment"),
      "the guard must be up before the network call"
    );
    assert.match(submit, /finally \{\s*setIsProcessing\(false\);/);
  });
});

describe("keyboard submission still works", () => {
  it("is a real form with a real submit button, not a click handler", () => {
    assert.match(formSource, /<form onSubmit=\{handleSubmit\}/,
      "Enter inside the card fields must submit");
    assert.match(formSource, /type="submit"/);
    assert.doesNotMatch(formSource, /<Button[^>]*onClick=\{handleSubmit\}/,
      "a click-only handler would not respond to Enter");
  });

  it("prevents the browser's default form post", () => {
    assert.match(formSource, /e\.preventDefault\(\)/);
  });
});

describe("Stripe validation and errors stay visible", () => {
  it("renders Stripe's own message in an assertive alert", () => {
    assert.match(formSource, /setError\(submitError\.message/);
    assert.match(formSource, /data-testid="payment-error"/);
    assert.match(formSource, /aria-live="assertive"/);
  });

  it("keeps the bottle-minimum block visible with its own alert", () => {
    assert.match(formSource, /!bottleRequirement\.met && \(/);
    assert.match(formSource, /role="alert"/);
  });
});

describe("initialisation is preserved, not presented as a Pay action", () => {
  it("the effect still creates the PaymentIntent", () => {
    assert.match(pageSource, /const initializePayment = async/);
    assert.match(pageSource, /PaymentService\.createPaymentIntent\(/);
  });

  it("shows a status panel while it prepares, not a second button", () => {
    assert.match(pageSource, /data-testid="payment-initializing"/);
    assert.match(pageSource, /Preparing secure payment/);
  });

  it("offers Try again on failure, worded so it cannot read as Pay", () => {
    assert.match(pageSource, /data-testid="payment-init-error"/);
    assert.match(pageSource, /setInitRetryKey\(\(n\) => n \+ 1\)/);
    assert.match(pageSource, /No card has been charged/);
  });

  it("the retry actually re-runs initialisation", () => {
    assert.match(pageSource, /\}, \[reservationDetails, user, params\.id, initRetryKey\]\);/);
  });

  it("does not blank the page while initialising", () => {
    const init = pageSource.slice(pageSource.indexOf("const initializePayment"));
    const body = init.slice(0, init.indexOf("initializePayment();"));
    assert.doesNotMatch(body, /setLoading\(true\)/,
      "the order summary must stay on screen while the intent is created");
  });
});

describe("payment calculations and safeguards are untouched", () => {
  it("keeps the pricing formulas", () => {
    assert.match(pageSource, /taxableSubtotal \* 0\.0825/);
    assert.match(pageSource, /bottlesCost \* 0\.18/);
    assert.match(pageSource, /\(subtotal \* 0\.029\) \+ 0\.30/);
  });

  it("still submits the total in cents, rounded", () => {
    assert.match(pageSource, /Math\.round\(total \* 100\)/);
  });

  it("keeps the auth redirect and the reservation-details guard", () => {
    assert.match(pageSource, /router\.push\('\/auth\/login'\)/);
    assert.match(pageSource, /router\.push\(`\/reserve\/\$\{params\.id\}`\)/);
  });

  it("keeps confirmation handling on success", () => {
    assert.match(formSource, /onSuccess\(\)/);
    assert.match(pageSource, /onSuccess=\{handlePaymentSuccess\}/);
  });
});
