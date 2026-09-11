import React, { useState, useEffect } from 'react';
import { Smartphone, Trash2, RefreshCw, QrCode, AlertTriangle } from 'lucide-react';
import { MobileDevice } from '../../types/erp';
import { getApiToken } from '../../lib/apiClient';
import { getActiveSession } from '../../utils/sessionManager';
import { toast } from 'sonner';

export const MobileDevicesTab: React.FC = () => {
  const [devices, setDevices] = useState<MobileDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [pairingData, setPairingData] = useState<{ code: string; expiresAt: string } | null>(null);
  const [serverModeError, setServerModeError] = useState(false);

  const getToken = () => {
    let t = getApiToken();
    if (!t) {
      const session = getActiveSession();
      // If the session token is not a fake local token, use it
      if (session?.sessionToken && !session.sessionToken.startsWith('recura_sess_')) {
        t = session.sessionToken;
      }
    }
    
    if (!t) {
      setServerModeError(true);
    } else {
      setServerModeError(false);
    }
    return t;
  };

  const fetchDevices = async () => {
    try {
      const token = getToken();
      if (!token) { setLoading(false); return; }
      const res = await fetch('/api/mobile/devices', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.ok) {
        setDevices(data.devices);
        setServerModeError(false);
      } else {
        toast.error(data.message || 'Failed to load mobile devices.');
      }
    } catch (err) {
      toast.error('Failed to load mobile devices.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const handleRevoke = async (id: string) => {
    if (!window.confirm('Are you sure you want to revoke this device?')) return;
    try {
      const token = getToken();
      if (!token) return;
      const res = await fetch('/api/mobile/devices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action: 'revoke', id }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success('Device revoked successfully.');
        fetchDevices();
      } else {
        toast.error(data.message || 'Failed to revoke device.');
      }
    } catch (err) {
      toast.error('Failed to revoke device.');
    }
  };

  const handleGeneratePairing = async () => {
    try {
      const token = getToken();
      if (!token) return;
      const res = await fetch('/api/mobile/generate', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.ok) {
        setPairingData({ code: data.code, expiresAt: data.expiresAt });
      } else {
        toast.error(data.message || 'Failed to generate pairing token.');
      }
    } catch (err) {
      toast.error('Failed to generate pairing token.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Mobile Devices</h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage Android devices connected to your Recura installation.
          </p>
        </div>
        <button
          onClick={handleGeneratePairing}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
        >
          <QrCode className="w-4 h-4" />
          <span>Link New Device</span>
        </button>
      </div>

      {serverModeError && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-bold text-amber-900">Server Mode Required</p>
            <p className="text-amber-700 mt-0.5">
              Mobile device management requires the Recura backend server to be running.
              Please log in while the server is active to use this feature.
            </p>
          </div>
        </div>
      )}

      {pairingData && (
        <div className="p-6 bg-indigo-50 border border-indigo-100 rounded-lg flex flex-col items-center justify-center space-y-4">
          <h3 className="text-lg font-bold text-indigo-900">Pair Android Device</h3>
          <p className="text-sm text-indigo-700 text-center max-w-sm">
            Enter this code in your Recura Android App to link it securely to this installation.
          </p>
          <div className="text-4xl font-mono tracking-widest text-indigo-900 font-bold bg-white px-6 py-4 rounded shadow-sm border border-indigo-200">
            {pairingData.code.match(/.{1,4}/g)?.join('-')}
          </div>
          <p className="text-xs text-indigo-500">
            Expires at {new Date(pairingData.expiresAt).toLocaleTimeString()}
          </p>
          <button 
            onClick={() => setPairingData(null)}
            className="text-sm text-indigo-600 hover:text-indigo-800 underline"
          >
            Close
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-8">
          <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : devices.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 rounded-lg border border-gray-200">
          <Smartphone className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No mobile devices linked.</p>
          <p className="text-gray-400 text-sm mt-1">Click "Link New Device" to pair an Android app.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {devices.map((device) => (
              <li key={device.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`p-2 rounded-full ${device.status === 'active' ? 'bg-green-100' : 'bg-red-100'}`}>
                    <Smartphone className={`w-6 h-6 ${device.status === 'active' ? 'text-green-600' : 'text-red-600'}`} />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">
                      {device.device_name} <span className="text-xs text-gray-500">({device.platform} {device.app_version})</span>
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Status: <span className={device.status === 'active' ? 'text-green-600' : 'text-red-600'}>{device.status}</span>
                      {device.user_name && <span className="ml-2">User: {device.user_name}</span>}
                      <span className="ml-2">Last seen: {new Date(device.last_seen_at).toLocaleDateString()}</span>
                    </p>
                  </div>
                </div>
                {device.status === 'active' && (
                  <button
                    onClick={() => handleRevoke(device.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Revoke Access"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
