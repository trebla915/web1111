import { StyleSheet } from "react-native";

export const GlobalStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#000", // Full black background
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#1c1c1c",
    borderRadius: 10,
    marginVertical: 8,
    overflow: "hidden",
  },
  textPrimary: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  textSecondary: {
    color: "#bbb",
    fontSize: 14,
  },
  button: {
    backgroundColor: "#2ecc71",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
    marginRight: 5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 12,
  },
});