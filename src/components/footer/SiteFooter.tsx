import { getProfile } from "@/lib/api";
import {
  CONTACTS,
  PRIVACY_POLICY_TEXT,
  PERSONAL_DATA_POLICY_TEXT,
} from "@/lib/constants";
import Footer from "./Footer";

export default async function SiteFooter() {
  let email = CONTACTS.email;
  let phone = CONTACTS.phone;
  let privacyPolicy = PRIVACY_POLICY_TEXT;
  let personalDataPolicy = PERSONAL_DATA_POLICY_TEXT;

  try {
    const profile = await getProfile();
    if (profile) {
      email = profile.email || CONTACTS.email;
      phone = profile.phone || CONTACTS.phone;
      privacyPolicy = profile.privacyPolicy.trim() || PRIVACY_POLICY_TEXT;
      personalDataPolicy =
        profile.personalDataPolicy.trim() || PERSONAL_DATA_POLICY_TEXT;
    }
  } catch (error) {
    console.error("Failed to load footer contacts from DB:", error);
  }

  return (
    <Footer
      email={email}
      phone={phone}
      privacyPolicy={privacyPolicy}
      personalDataPolicy={personalDataPolicy}
    />
  );
}
