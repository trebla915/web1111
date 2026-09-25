"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/providers/AuthProvider"

/** Signed-in state and the login modal, shared by the desktop menu and the drawer. */
export function useHeaderAccount() {
  const { user, logout } = useAuth()
  const [loginOpen, setLoginOpen] = useState(false)

  // The modal closes itself once sign-in lands.
  useEffect(() => {
    if (user && loginOpen) setLoginOpen(false)
  }, [user, loginOpen])

  return {
    signedIn: Boolean(user),
    /** The local part of the email, the only name the header shows. */
    displayName: user?.email?.split("@")[0] ?? "",
    loginOpen,
    openLogin: () => setLoginOpen(true),
    closeLogin: () => setLoginOpen(false),
    signOut: logout,
  }
}

export type HeaderAccount = ReturnType<typeof useHeaderAccount>
