import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useClusterStore } from '@/store/cluster-store';
import { Server, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from '@/lib/i18n';

export function Connections() {
  const { clusters, activeClusterId, setActiveCluster, addCluster, deleteCluster } = useClusterStore();
  const { t } = useTranslation();
  const location = useLocation();
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (location.state?.addCluster) {
      setIsAdding(true);
      window.history.replaceState({}, '');
    }
  }, [location.state]);

  const [formData, setFormData] = useState({
    name: '',
    endpoint: '',
    region: 'us-east-1',
    admin_endpoint: '',
    admin_token: '',
    use_ssl: true,
    force_path_style: true,
  });

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addCluster(formData);
      toast.success(t('connections.notifications.added'));
      setIsAdding(false);
      setFormData({
        name: '',
        endpoint: '',
        region: 'us-east-1',
        admin_endpoint: '',
        admin_token: '',
        use_ssl: true,
        force_path_style: true,
      });
    } catch {
      toast.error(t('connections.errors.addFailed'));
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm(t('connections.confirmRemove'))) {
      try {
        await deleteCluster(id);
        toast.success(t('connections.notifications.removed'));
      } catch {
        toast.error(t('connections.errors.removeFailed'));
      }
    }
  };

  return (
    <div>
      <PageHeader title={t('connections.title')} subtitle={t('connections.subtitle')} />
      
      <div className="p-6 space-y-6 max-w-5xl">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold tracking-tight">{t('connections.connected')}</h2>
          {!isAdding && (
            <Button onClick={() => setIsAdding(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              {t('connections.add')}
            </Button>
          )}
        </div>

        {isAdding && (
          <Card className="border-primary/50 shadow-sm">
            <CardHeader>
              <CardTitle>{t('connections.add_new')}</CardTitle>
              <CardDescription>{t('connections.add_desc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('connections.name')}</label>
                    <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder={t('connections.name_placeholder')} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('connections.region')}</label>
                    <Input required value={formData.region} onChange={e => setFormData({...formData, region: e.target.value})} placeholder="us-east-1" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('connections.s3_endpoint')}</label>
                    <Input required value={formData.endpoint} onChange={e => setFormData({...formData, endpoint: e.target.value})} placeholder="s3.garage.local" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('connections.admin_endpoint')}</label>
                    <Input required value={formData.admin_endpoint} onChange={e => setFormData({...formData, admin_endpoint: e.target.value})} placeholder="http://localhost:3903" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">{t('connections.admin_token')}</label>
                    <Input required type="password" value={formData.admin_token} onChange={e => setFormData({...formData, admin_token: e.target.value})} placeholder="eyJhbG..." />
                  </div>
                </div>
                <div className="flex gap-2 justify-end pt-4">
                  <Button type="button" variant="secondary" onClick={() => setIsAdding(false)}>{t('connections.cancel')}</Button>
                  <Button type="submit">{t('connections.save')}</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {clusters.map((cluster) => (
            <Card key={cluster.id} className={activeClusterId === cluster.id ? "ring-2 ring-primary" : ""}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Server className="h-4 w-4 text-primary" />
                    {cluster.name}
                    {activeClusterId === cluster.id && (
                      <span className="flex items-center gap-1 text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="h-3 w-3" /> {t('connections.active')}
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription className="text-xs font-mono">{cluster.id}</CardDescription>
                </div>
                <Button variant="ghost" size="icon" aria-label={t('connections.removeAriaLabel', { name: cluster.name })} className="text-destructive hover:bg-destructive/10 -mr-2" onClick={() => handleDelete(cluster.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <div className="grid grid-cols-[100px_1fr] gap-1 text-sm">
                  <span className="text-muted-foreground">{t('connections.s3_url')}:</span>
                  <span className="font-medium truncate">{cluster.use_ssl ? 'https://' : 'http://'}{cluster.endpoint}</span>
                  
                  <span className="text-muted-foreground">{t('connections.admin_api')}:</span>
                  <span className="font-medium truncate">{cluster.admin_endpoint}</span>
                  
                  <span className="text-muted-foreground">{t('connections.region')}:</span>
                  <span className="font-medium">{cluster.region}</span>
                </div>
                
                {activeClusterId !== cluster.id && (
                  <Button variant="secondary" className="w-full mt-2" onClick={() => setActiveCluster(cluster.id)}>
                    {t('connections.switch')}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
          {clusters.length === 0 && !isAdding && (
            <div className="col-span-full py-12 text-center text-muted-foreground bg-muted/50 rounded-xl border border-dashed">
              <Server className="h-12 w-12 mx-auto opacity-20 mb-3" />
              <p>{t('connections.no_clusters')}</p>
              <Button variant="link" onClick={() => setIsAdding(true)}>{t('connections.add_first')}</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
