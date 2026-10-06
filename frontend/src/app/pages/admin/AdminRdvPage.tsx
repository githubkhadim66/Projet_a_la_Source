/** Rendez-vous expert : liste des réservations, annulation (libère le créneau). */

import { useEffect, useState } from "react";
import { Calendar, CheckCircle, Clock, XCircle } from "lucide-react";
import * as api from "@/lib/api";
import type { ApiAppointment } from "@/lib/api";
import { fmtDate } from "@/lib/format";
import type { Nav } from "@/lib/routes";
import { AdminShell, KpiCard } from "./AdminShell";
import { useAdminGuard } from "./adminSession";
import { useAdminText } from "@/lib/adminText";
import { useOptionLabel } from "@/lib/formsText";

export function AdminRdv({ nav }: { nav: Nav }) {
  const t = useAdminText().rdv;
  const tr = useOptionLabel();
  const onApiError = useAdminGuard(nav);
  const [appointments, setAppointments] = useState<ApiAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!api.getAdminToken()) return;
    api.admin.appointments()
      .then(setAppointments)
      .catch(onApiError)
      .finally(() => setLoading(false));
  }, [onApiError]);

  const setStatus = async (id: number, status: "confirmé" | "annulé") => {
    try {
      const updated = await api.admin.updateAppointment(id, status);
      setAppointments(prev => prev.map(a => a.id === id ? updated : a));
    } catch (err) {
      onApiError(err);
    }
  };

  const today = new Date().toISOString().slice(0, 10);
  const confirmed = appointments.filter(a => a.status === "confirmé");
  const upcoming = confirmed.filter(a => a.day >= today);

  const badge = (status: string) =>
    status === "confirmé" ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
      : "bg-gray-100 text-gray-500 border border-gray-200";

  return (
    <AdminShell nav={nav} active="rdv">
      <h1 className="text-xl font-bold text-[#0a0a0f] mb-5">{t.title}</h1>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-7">
        <KpiCard label={t.total} value={appointments.length} sub={t.totalSub} icon={Calendar} color="#0d2265" />
        <KpiCard label={t.upcoming} value={upcoming.length} sub={t.upcomingSub} icon={Clock} color="#C4613A" />
        <KpiCard label={t.confirmed} value={confirmed.length} sub={t.confirmedSub} icon={CheckCircle} color="#059669" />
        <KpiCard label={t.cancelled} value={appointments.length - confirmed.length} sub={t.cancelledSub} icon={XCircle} color="#ef4444" />
      </div>

      <div className="bg-white border border-[rgba(13,34,101,0.1)] overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[rgba(13,34,101,0.08)] bg-[#f4f5f9]">
              {t.headers.map((h, i) => (
                <th key={i} className="text-left px-4 py-3 text-[10px] font-semibold text-[#64697d] uppercase tracking-widest whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-sm text-[#64697d]">{t.loading}</td></tr>
            )}
            {!loading && appointments.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-sm text-[#64697d]">{t.empty}</td></tr>
            )}
            {appointments.map(a => (
              <tr key={a.id} className="border-b border-[rgba(13,34,101,0.06)] hover:bg-[#f4f5f9] transition-colors">
                <td className="px-4 py-3 font-medium text-[#0a0a0f] whitespace-nowrap">{fmtDate(a.day)}</td>
                <td className="px-4 py-3 text-[#0a0a0f] font-mono">{a.slot}</td>
                <td className="px-4 py-3 text-[#64697d]">{a.duration_minutes} min</td>
                <td className="px-4 py-3 font-semibold text-[#0a0a0f]">{a.name}</td>
                <td className="px-4 py-3 text-[#64697d]">{a.company}</td>
                <td className="px-4 py-3 text-[#64697d] text-xs break-all">{a.email}</td>
                <td className="px-4 py-3 text-[#64697d] text-xs">{a.motif ? tr(a.motif) : "·"}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-1 ${badge(a.status)}`}>{tr(a.status)}</span>
                </td>
                <td className="px-4 py-3">
                  {a.status === "confirmé" ? (
                    <button onClick={() => setStatus(a.id, "annulé")}
                      className="text-xs font-medium px-2 py-1 cursor-pointer transition-colors border border-red-200 text-red-600 hover:bg-red-50">
                      {t.cancel}
                    </button>
                  ) : (
                    <button onClick={() => setStatus(a.id, "confirmé")}
                      className="text-xs font-medium px-2 py-1 cursor-pointer transition-colors border border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                      {t.reconfirm}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-[#64697d] mt-4">
        {t.note}
      </p>
    </AdminShell>
  );
}
