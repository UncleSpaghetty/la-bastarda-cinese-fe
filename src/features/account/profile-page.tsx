import { AuthGateway, PrivacySection } from "./components/auth-and-privacy";
import { IdentityForm } from "./components/identity-form";
import { PreferencesForm } from "./components/preferences-form";
import { PublicProfileForm } from "./components/public-profile-form";
import { useProfileNavigationGuard } from "./hooks/use-profile-navigation-guard";
import { useProfileQuery } from "./hooks/use-profile-query";
import { SettingsShell } from "./settings-shell";
import { ACCOUNT_COPY } from "@/content/copy";

export function ProfilePage() {
  const { profile, refresh } = useProfileQuery();
  const { active, dirty, setDirty, navigateSection } = useProfileNavigationGuard();

  return (
    <section className="account-page page-container">
      <header className="page-heading">
        <p className="eyebrow">ACCOUNT E IMPOSTAZIONI</p>
        <h1>{ACCOUNT_COPY.title}</h1>
        <p>{ACCOUNT_COPY.description}</p>
      </header>
      {profile.isLoading && (
        <div className="account-skeleton">
          <aside />
          <main />
        </div>
      )}
      {profile.isError && <AuthGateway onSuccess={refresh} />}
      {profile.data && (
        <SettingsShell active={active} dirty={dirty} onNavigate={navigateSection}>
          {active === "profile" && (
            <PublicProfileForm profile={profile.data} onSaved={refresh} onDirty={setDirty} />
          )}
          {active === "identity" && (
            <IdentityForm profile={profile.data} onLoggedOut={refresh} onDirty={setDirty} />
          )}
          {active === "preferences" && (
            <PreferencesForm profile={profile.data} onSaved={refresh} onDirty={setDirty} />
          )}
          {active === "privacy" && <PrivacySection />}
        </SettingsShell>
      )}
    </section>
  );
}
