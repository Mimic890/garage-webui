import { useEffect, useState } from 'react';
import { KeyRound, Shield, Trash2, User } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuthStore } from '@/store/auth-store';
import { authApi } from '@/lib/api';
import type { Account, SensitiveAccountInput, TotpEnrollment } from '@/types/auth';
import {
  creationOptionsFromJSON,
  credentialToJSON,
  isWebAuthnCancellation,
  isWebAuthnSupported,
  type CreationOptionsJSON,
} from '@/lib/webauthn';
import { useTranslation } from '@/lib/i18n';
import { useSettingsStore } from '@/store/settings-store';

const labelClass = 'text-sm font-medium';

function message(_error: unknown, fallback: string) {
  return fallback;
}

function SensitiveFields({
  id,
  value,
  onChange,
  secondFactor,
  disabled,
}: {
  id: string;
  value: SensitiveAccountInput;
  onChange: (value: SensitiveAccountInput) => void;
  secondFactor: boolean;
  disabled: boolean;
}) {
  const { t } = useTranslation();
  return <>
    <div className="space-y-2">
      <label className={labelClass} htmlFor={`${id}-password`}>{t('userSettings.credentials.currentPassword')}</label>
      <Input id={`${id}-password`} type="password" autoComplete="current-password" required disabled={disabled}
        value={value.current_password} onChange={(event) => onChange({ ...value, current_password: event.target.value })} />
    </div>
    {secondFactor && <div className="space-y-2">
      <label className={labelClass} htmlFor={`${id}-factor`}>{t('userSettings.credentials.secondFactor')}</label>
      <Input id={`${id}-factor`} autoComplete="one-time-code" required disabled={disabled}
        value={value.second_factor || ''} onChange={(event) => onChange({ ...value, second_factor: event.target.value.trim() })} />
    </div>}
  </>;
}

const emptySensitive = (): SensitiveAccountInput => ({ current_password: '', second_factor: '' });

export function UserSettings() {
  const { t, language } = useTranslation();
  const timezone = useSettingsStore((state) => state.timezone);
  const number = new Intl.NumberFormat(language);
  const formatDate = (value: string) => new Intl.DateTimeFormat(language, {
    dateStyle: 'medium',
    timeStyle: 'short',
    ...(timezone ? { timeZone: timezone } : {}),
  }).format(new Date(value));
  const { config, user, setUser } = useAuthStore();
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const [email, setEmail] = useState('');
  const [profileAuth, setProfileAuth] = useState(emptySensitive);
  const [passwordAuth, setPasswordAuth] = useState(emptySensitive);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [totpOpen, setTotpOpen] = useState(false);
  const [totpPassword, setTotpPassword] = useState('');
  const [enrollment, setEnrollment] = useState<TotpEnrollment | null>(null);
  const [totpCode, setTotpCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [codesAcknowledged, setCodesAcknowledged] = useState(false);
  const [recoveryAuth, setRecoveryAuth] = useState(emptySensitive);
  const [disableAuth, setDisableAuth] = useState(emptySensitive);

  const [passkeyName, setPasskeyName] = useState('');
  const [passkeyAuth, setPasskeyAuth] = useState(emptySensitive);
  const [removeAuth, setRemoveAuth] = useState(emptySensitive);

  const loadAccount = async () => {
    const next = await authApi.getAccount();
    setAccount(next);
    setEmail(next.email || '');
    setUser({ ...user, username: next.username, email: next.email, auth_method: next.auth_method });
  };

  useEffect(() => {
    if (user?.auth_method === 'oidc' || user?.auth_method === 'token') {
      setLoading(false);
      return;
    }
    loadAccount().catch((reason) => setError(message(reason, t('userSettings.errors.loadFailed')))).finally(() => setLoading(false));
    // Account is intentionally fetched once when this page opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const run = async (name: string, action: () => Promise<void>, success: string) => {
    if (pending) return;
    setPending(name);
    setError('');
    setNotice('');
    try {
      await action();
      setNotice(success);
      await loadAccount();
    } catch (reason) {
      if (!isWebAuthnCancellation(reason)) setError(message(reason, t('userSettings.errors.changeFailed')));
    } finally {
      setPending('');
    }
  };

  const saveEmail = (event: React.FormEvent) => {
    event.preventDefault();
    run('profile', async () => {
      await authApi.updateAccount({ ...profileAuth, email });
      setProfileAuth(emptySensitive());
    }, t('userSettings.notifications.emailUpdated'));
  };

  const changePassword = (event: React.FormEvent) => {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      setError(t('userSettings.errors.passwordMismatch'));
      return;
    }
    run('password', async () => {
      await authApi.updateAccount({ ...passwordAuth, new_password: newPassword });
      setPasswordAuth(emptySensitive());
      setNewPassword('');
      setConfirmPassword('');
    }, t('userSettings.notifications.passwordChanged'));
  };

  const beginTotp = (event: React.FormEvent) => {
    event.preventDefault();
    run('totp-begin', async () => {
      setEnrollment(await authApi.beginTotp(totpPassword));
      setTotpPassword('');
    }, t('userSettings.notifications.scanQr'));
  };

  const finishTotp = (event: React.FormEvent) => {
    event.preventDefault();
    if (!enrollment) return;
    run('totp-finish', async () => {
      const result = await authApi.finishTotp(enrollment.enrollment_id, totpCode);
      setRecoveryCodes(result.recovery_codes);
      setEnrollment(null);
      setTotpCode('');
      setCodesAcknowledged(false);
    }, t('userSettings.notifications.totpEnabled'));
  };

  const closeCodes = () => {
    if (recoveryCodes.length && !codesAcknowledged) return;
    setTotpOpen(false);
    setEnrollment(null);
    setRecoveryCodes([]);
    setCodesAcknowledged(false);
    setTotpPassword('');
    setTotpCode('');
  };

  const regenerateCodes = (event: React.FormEvent) => {
    event.preventDefault();
    run('recovery', async () => {
      const result = await authApi.regenerateRecoveryCodes(recoveryAuth);
      setRecoveryAuth(emptySensitive());
      setRecoveryCodes(result.recovery_codes);
      setCodesAcknowledged(false);
      setTotpOpen(true);
    }, t('userSettings.notifications.recoveryCodesGenerated'));
  };

  const disableTotp = (event: React.FormEvent) => {
    event.preventDefault();
    run('totp-disable', async () => {
      await authApi.disableTotp(disableAuth);
      setDisableAuth(emptySensitive());
    }, t('userSettings.notifications.totpDisabled'));
  };

  const registerPasskey = (event: React.FormEvent) => {
    event.preventDefault();
    run('passkey-register', async () => {
      const begin = await authApi.beginPasskeyRegistration({ ...passkeyAuth, name: passkeyName });
      const options = begin.publicKey || begin.public_key || begin.options?.publicKey || begin as unknown as CreationOptionsJSON;
      const credential = await navigator.credentials.create({ publicKey: creationOptionsFromJSON(options) });
      if (!credential) throw new Error(t('userSettings.errors.passkeyNotCreated'));
      await authApi.finishPasskeyRegistration(begin.ceremony_id, credentialToJSON(credential as PublicKeyCredential));
      setPasskeyName('');
      setPasskeyAuth(emptySensitive());
    }, t('userSettings.notifications.passkeyRegistered'));
  };

  const removePasskey = (id: string) => run(`passkey-${id}`, async () => {
    await authApi.removePasskey(id, removeAuth);
    setRemoveAuth(emptySensitive());
  }, t('userSettings.notifications.passkeyRemoved'));

  if (loading) return <div className="p-6 text-sm text-[var(--muted-foreground)]">{t('userSettings.status.loadingAccount')}</div>;

  const method = account?.auth_method || user?.auth_method || '';
  const managed = method === 'oidc';
  const token = method === 'token';
  const needsSecondFactor = !!account?.totp_enabled;

  return <div>
    <PageHeader title={t('userSettings.title')} subtitle={t('userSettings.subtitle')} />
    <div className="max-w-4xl space-y-6 px-4 py-6 sm:px-6">
      <div aria-live="polite" className="space-y-1 text-sm">
        {notice && <p className="text-emerald-600">{notice}</p>}
        {error && <p role="alert" className="text-[var(--destructive)]">{error}</p>}
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-5 w-5" />{t('userSettings.profile.title')}</CardTitle><CardDescription>{t('userSettings.profile.description')}</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div><span className="text-xs text-[var(--muted-foreground)]">{t('userSettings.profile.username')}</span><p>{account?.username || user?.username}</p></div>
          {(managed || token) ? <p className="rounded-md border p-3 text-sm text-[var(--muted-foreground)]">
            {managed ? t('userSettings.profile.managedByProvider') : t('userSettings.profile.tokenChangesUnavailable')}
          </p> : <form className="space-y-4" onSubmit={saveEmail}>
            <div className="space-y-2"><label className={labelClass} htmlFor="account-email">{t('userSettings.profile.email')}</label><Input id="account-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} /></div>
            <SensitiveFields id="profile" value={profileAuth} onChange={setProfileAuth} secondFactor={needsSecondFactor} disabled={!!pending} />
            <Button disabled={!!pending} type="submit">{pending === 'profile' ? t('userSettings.profile.saving') : t('userSettings.profile.saveEmail')}</Button>
          </form>}
        </CardContent>
      </Card>

      {!managed && !token && <>
        <Card>
          <CardHeader><CardTitle>{t('userSettings.password.title')}</CardTitle><CardDescription>{t('userSettings.password.description')}</CardDescription></CardHeader>
          <CardContent><form className="space-y-4" onSubmit={changePassword}>
            <SensitiveFields id="change-password" value={passwordAuth} onChange={setPasswordAuth} secondFactor={needsSecondFactor} disabled={!!pending} />
            <div className="space-y-2"><label className={labelClass} htmlFor="new-password">{t('userSettings.password.newPassword')}</label><Input id="new-password" type="password" autoComplete="new-password" required value={newPassword} onChange={(event) => setNewPassword(event.target.value)} /></div>
            <div className="space-y-2"><label className={labelClass} htmlFor="confirm-password">{t('userSettings.password.confirmPassword')}</label><Input id="confirm-password" type="password" autoComplete="new-password" required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></div>
            <Button disabled={!!pending} type="submit">{pending === 'password' ? t('userSettings.password.changing') : t('userSettings.password.changeAction')}</Button>
          </form></CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" />{t('userSettings.totp.title')}</CardTitle><CardDescription>{needsSecondFactor ? t('userSettings.totp.recoveryCodesRemaining', { count: number.format(account?.recovery_codes_remaining || 0) }) : t('userSettings.totp.description')}</CardDescription></CardHeader>
          <CardContent className="space-y-6">
            {!needsSecondFactor ? <Button onClick={() => setTotpOpen(true)}>{t('userSettings.totp.enableAction')}</Button> : <>
              <form className="space-y-4" onSubmit={regenerateCodes}>
                 <h4 className="font-medium">{t('userSettings.totp.regenerateTitle')}</h4>
                <SensitiveFields id="recovery" value={recoveryAuth} onChange={setRecoveryAuth} secondFactor disabled={!!pending} />
                 <Button variant="secondary" disabled={!!pending} type="submit">{pending === 'recovery' ? t('userSettings.totp.generating') : t('userSettings.totp.generateAction')}</Button>
              </form>
              <form className="space-y-4 border-t pt-5" onSubmit={disableTotp}>
                 <h4 className="font-medium">{t('userSettings.totp.disableTitle')}</h4>
                <SensitiveFields id="disable-totp" value={disableAuth} onChange={setDisableAuth} secondFactor disabled={!!pending} />
                 <Button variant="destructive" disabled={!!pending} type="submit">{pending === 'totp-disable' ? t('userSettings.totp.disabling') : t('userSettings.totp.disableAction')}</Button>
              </form>
            </>}
          </CardContent>
        </Card>

        {config?.passkey?.enabled && <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5" />{t('userSettings.passkeys.title')}</CardTitle><CardDescription>{t('userSettings.passkeys.description')}</CardDescription></CardHeader>
          <CardContent className="space-y-5">
            {account?.passkeys?.length ? <ul className="divide-y rounded-md border">{account.passkeys.map((passkey) => <li key={passkey.id} className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div><p className="font-medium">{passkey.name}</p><p className="text-xs text-[var(--muted-foreground)]">{passkey.last_used_at ? t('userSettings.passkeys.addedAndLastUsed', { added: formatDate(passkey.created_at), lastUsed: formatDate(passkey.last_used_at) }) : t('userSettings.passkeys.added', { added: formatDate(passkey.created_at) })}</p></div>
              <Button type="button" size="sm" variant="destructive" disabled={!!pending || !removeAuth.current_password || (needsSecondFactor && !removeAuth.second_factor)} onClick={() => removePasskey(passkey.id)}><Trash2 />{pending === `passkey-${passkey.id}` ? t('userSettings.passkeys.removing') : t('userSettings.passkeys.removeAction')}</Button>
            </li>)}</ul> : <p className="text-sm text-[var(--muted-foreground)]">{t('userSettings.passkeys.empty')}</p>}

            {!!account?.passkeys?.length && <div className="space-y-4 rounded-md border p-4"><p className="text-sm font-medium">{t('userSettings.passkeys.removeCredentialsTitle')}</p><SensitiveFields id="remove-passkey" value={removeAuth} onChange={setRemoveAuth} secondFactor={needsSecondFactor} disabled={!!pending} /></div>}

            {isWebAuthnSupported() ? <form className="space-y-4 border-t pt-5" onSubmit={registerPasskey}>
              <h4 className="font-medium">{t('userSettings.passkeys.registerTitle')}</h4>
              <div className="space-y-2"><label className={labelClass} htmlFor="passkey-name">{t('userSettings.passkeys.nameLabel')}</label><Input id="passkey-name" autoComplete="off" required value={passkeyName} onChange={(event) => setPasskeyName(event.target.value)} placeholder={t('userSettings.passkeys.namePlaceholder')} /></div>
              <SensitiveFields id="register-passkey" value={passkeyAuth} onChange={setPasskeyAuth} secondFactor={needsSecondFactor} disabled={!!pending} />
              <Button disabled={!!pending} type="submit">{pending === 'passkey-register' ? t('userSettings.passkeys.waiting') : t('userSettings.passkeys.registerAction')}</Button>
            </form> : <p className="text-sm text-[var(--muted-foreground)]">{t('userSettings.passkeys.unsupported')}</p>}
          </CardContent>
        </Card>}
      </>}
    </div>

    <Dialog open={totpOpen} onOpenChange={(open) => open ? setTotpOpen(true) : closeCodes()} size="form">
      <DialogContent>
        <DialogHeader><div><DialogTitle>{recoveryCodes.length ? t('userSettings.totp.dialog.recoveryTitle') : t('userSettings.totp.dialog.setupTitle')}</DialogTitle><DialogDescription>{recoveryCodes.length ? t('userSettings.totp.dialog.recoveryDescription') : t('userSettings.totp.dialog.setupDescription')}</DialogDescription></div></DialogHeader>
        <DialogBody>
          {recoveryCodes.length ? <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 rounded-md border bg-[var(--surface)] p-4 font-mono text-sm" aria-label={t('userSettings.totp.dialog.recoveryCodesAriaLabel')}>{recoveryCodes.map((code) => <span key={code}>{code}</span>)}</div>
            <Button type="button" variant="secondary" onClick={() => navigator.clipboard.writeText(recoveryCodes.join('\n')).then(() => toast.success(t('userSettings.notifications.recoveryCodesCopied')))}>{t('userSettings.totp.dialog.copyCodesAction')}</Button>
            <label className="flex items-start gap-2 text-sm"><input className="mt-1" type="checkbox" checked={codesAcknowledged} onChange={(event) => setCodesAcknowledged(event.target.checked)} />{t('userSettings.totp.dialog.savedAcknowledgement')}</label>
          </div> : enrollment ? <form id="totp-finish" className="space-y-4" onSubmit={finishTotp}>
            <img src={enrollment.qr_code_data_url} alt={t('userSettings.totp.dialog.qrCodeAlt')} className="mx-auto max-h-56 max-w-full" />
            <div className="space-y-2"><label className={labelClass} htmlFor="manual-key">{t('userSettings.totp.dialog.manualKeyLabel')}</label><div className="flex gap-2"><Input id="manual-key" readOnly value={enrollment.secret} className="font-mono" onFocus={(event) => event.currentTarget.select()} /><Button type="button" variant="secondary" onClick={() => navigator.clipboard.writeText(enrollment.secret).then(() => toast.success(t('userSettings.notifications.setupKeyCopied')))}>{t('common.actions.copy')}</Button></div></div>
            <div className="space-y-2"><label className={labelClass} htmlFor="totp-code">{t('userSettings.totp.dialog.codeLabel')}</label><Input id="totp-code" inputMode="numeric" pattern="[0-9]*" autoComplete="one-time-code" required value={totpCode} onChange={(event) => setTotpCode(event.target.value.replace(/\D/g, ''))} /></div>
          </form> : <form id="totp-begin" className="space-y-4" onSubmit={beginTotp}>
            <div className="space-y-2"><label className={labelClass} htmlFor="totp-password">{t('userSettings.credentials.currentPassword')}</label><Input id="totp-password" type="password" autoComplete="current-password" required value={totpPassword} onChange={(event) => setTotpPassword(event.target.value)} /></div>
          </form>}
        </DialogBody>
        <DialogFooter>
          {recoveryCodes.length ? <Button type="button" disabled={!codesAcknowledged} onClick={closeCodes}>{t('common.actions.done')}</Button> : <Button type="submit" form={enrollment ? 'totp-finish' : 'totp-begin'} disabled={!!pending}>{pending ? t('common.status.working') : enrollment ? t('userSettings.totp.dialog.verifyEnableAction') : t('common.actions.continue')}</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>;
}
