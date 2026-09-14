import { getProfile } from "@/lib/api";
import { CONTACTS } from "@/lib/constants";
import Footer from "./Footer";

export default async function SiteFooter() {
  let email = CONTACTS.email;
  let phone = CONTACTS.phone;

  try {
    const profile = await getProfile();
    if (profile) {
      email = profile.email || CONTACTS.email;
      phone = profile.phone || CONTACTS.phone;
    }
  } catch (error) {
    console.error("Failed to load footer contacts from DB:", error);
  }

  return <Footer email={email} phone={phone} />;
}
