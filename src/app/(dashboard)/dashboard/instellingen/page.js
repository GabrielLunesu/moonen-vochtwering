import SettingsForm from '@/app/components/dashboard/SettingsForm';
import EmailTemplateEditor from '@/app/components/dashboard/EmailTemplateEditor';
import GoogleCalendarSettings from '@/app/components/dashboard/GoogleCalendarSettings';

export const metadata = {
  title: 'Instellingen | Moonen CRM',
};

export default function InstellingenPage() {
  return (
    <div>
      <div className="border-b px-6 py-4">
        <h1 className="text-xl font-bold">Instellingen</h1>
        <p className="text-sm text-muted-foreground">
          Prijzen, follow-up, e-mailsjablonen en integraties
        </p>
      </div>
      <div className="p-6 space-y-6 max-w-4xl">
        <SettingsForm />
        <EmailTemplateEditor />
        <GoogleCalendarSettings />
      </div>
    </div>
  );
}
