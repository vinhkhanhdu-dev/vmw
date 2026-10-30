import React, { useState } from 'react';
import {
  Users,
  UtensilsCrossed,
  CheckCircle2,
  Clock,
  Download,
  Settings,
  Calendar,
  MapPin,
  Copy,
  Check,
  PieChart as PieChartIcon,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { Guest, WeddingInfo } from '../types';
import { TabHeader, Modal, IconTile } from './ui';

interface TablesTabProps {
  guests: Guest[];
  weddingInfo: WeddingInfo;
  onUpdateWeddingInfo: (info: WeddingInfo) => void;
}

type ChartMode = 'group' | 'side' | 'status';

const CHART_MODES: { id: ChartMode; label: string }[] = [
  { id: 'group', label: 'Nhóm quan hệ' },
  { id: 'side', label: 'Theo phe' },
  { id: 'status', label: 'Trạng thái' },
];

const Kpi: React.FC<{
  icon: React.ReactNode;
  tile: string;
  label: string;
  value: React.ReactNode;
  unit: string;
  caption: string;
  valueClass?: string;
}> = ({ icon, tile, label, value, unit, caption, valueClass = 'text-stone-900' }) => (
  <div className="card p-3.5">
    <div className="flex items-center justify-between">
      <span className="text-[11px] font-semibold text-stone-500">{label}</span>
      <IconTile className={`w-8 h-8 rounded-lg ${tile}`}>{icon}</IconTile>
    </div>
    <div className={`mt-2 text-[26px] leading-none font-bold tracking-tight tabular-nums ${valueClass}`}>
      {value} <span className="text-xs font-medium text-stone-400">{unit}</span>
    </div>
    <div className="text-[11px] text-stone-500 mt-1.5">{caption}</div>
  </div>
);

const Bar: React.FC<{ label: string; value: number; total: number; tables?: number; color: string; labelClass: string }> = ({
  label,
  value,
  total,
  tables,
  color,
  labelClass,
}) => (
  <div>
    <div className="flex justify-between items-baseline mb-1.5 text-xs">
      <span className={`font-semibold ${labelClass}`}>{label}</span>
      <span className="tabular-nums text-stone-600">
        <span className="font-semibold text-stone-900">{value}</span> người
        {tables !== undefined && <span className="text-stone-400"> · ~{tables} bàn</span>}
      </span>
    </div>
    <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
      <div
        className={`${color} h-2 rounded-full transition-all duration-700`}
        style={{ width: `${total > 0 ? (value / total) * 100 : 0}%` }}
      />
    </div>
  </div>
);

export const TablesTab: React.FC<TablesTabProps> = ({ guests, weddingInfo, onUpdateWeddingInfo }) => {
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [tempInfo, setTempInfo] = useState(weddingInfo);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [chartMode, setChartMode] = useState<ChartMode>('group');

  // Calculations
  const totalInvites = guests.length;
  const totalHeadcount = guests.reduce((sum, g) => sum + (g.count || 1), 0);
  const confirmedHeadcount = guests
    .filter((g) => g.status === 'xac_nhan')
    .reduce((sum, g) => sum + (g.count || 1), 0);
  const pendingHeadcount = guests
    .filter((g) => g.status === 'da_gui' || g.status === 'chua_chac' || g.status === 'chua_gui')
    .reduce((sum, g) => sum + (g.count || 1), 0);
  const declinedHeadcount = guests
    .filter((g) => g.status === 'tu_choi')
    .reduce((sum, g) => sum + (g.count || 1), 0);

  const capacity = weddingInfo.tableCapacity || 10;
  const totalTables = Math.ceil(totalHeadcount / capacity);
  const confirmedTables = Math.ceil(confirmedHeadcount / capacity);

  // Side Breakdown
  const nhaTraiCount = guests.filter((g) => g.side === 'nha_trai').reduce((sum, g) => sum + (g.count || 1), 0);
  const nhaGaiCount = guests.filter((g) => g.side === 'nha_gai').reduce((sum, g) => sum + (g.count || 1), 0);
  const chungCount = guests.filter((g) => g.side === 'chung').reduce((sum, g) => sum + (g.count || 1), 0);

  // Category Breakdown
  const catBreakdown = {
    ho_hang: guests.filter((g) => g.relationshipCategory === 'ho_hang').reduce((s, g) => s + (g.count || 1), 0),
    ban_be: guests.filter((g) => g.relationshipCategory === 'ban_be').reduce((s, g) => s + (g.count || 1), 0),
    dong_nghiep: guests.filter((g) => g.relationshipCategory === 'dong_nghiep').reduce((s, g) => s + (g.count || 1), 0),
    vip: guests.filter((g) => g.relationshipCategory === 'vip').reduce((s, g) => s + (g.count || 1), 0),
    khac: guests.filter((g) => g.relationshipCategory === 'khac').reduce((s, g) => s + (g.count || 1), 0),
  };

  const groupChartData = [
    { name: 'Họ hàng / Người thân', value: catBreakdown.ho_hang, color: '#8e1d3d' },
    { name: 'Bạn bè', value: catBreakdown.ban_be, color: '#c2923a' },
    { name: 'Đồng nghiệp', value: catBreakdown.dong_nghiep, color: '#0f766e' },
    { name: 'Đối tác / VIP', value: catBreakdown.vip, color: '#4338ca' },
    { name: 'Khác', value: catBreakdown.khac, color: '#78716c' },
  ].filter((item) => item.value > 0);

  const sideChartData = [
    { name: 'Nhà Trai (Chú rể)', value: nhaTraiCount, color: '#0284c7' },
    { name: 'Nhà Gái (Cô dâu)', value: nhaGaiCount, color: '#db2777' },
    { name: 'Khách chung', value: chungCount, color: '#78716c' },
  ].filter((item) => item.value > 0);

  const statusChartData = [
    { name: 'Đi được (Đã chốt)', value: confirmedHeadcount, color: '#059669' },
    { name: 'Đang chờ / Chưa gửi', value: pendingHeadcount, color: '#f59e0b' },
    { name: 'Bận không đi', value: declinedHeadcount, color: '#a8a29e' },
  ].filter((item) => item.value > 0);

  const currentChartData = chartMode === 'group' ? groupChartData : chartMode === 'side' ? sideChartData : statusChartData;

  const openSettings = () => {
    setTempInfo(weddingInfo);
    setIsEditingSettings(true);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateWeddingInfo(tempInfo);
    setIsEditingSettings(false);
  };

  const handleExportCSV = () => {
    const headers = ['STT,Họ Tên,Phe,Mối Quan Hệ,Số Lượng,SĐT,Trạng Thái,Bàn Số,Ghi Chú'];
    const rows = guests.map((g, idx) => {
      const sideName = g.side === 'nha_trai' ? 'Nhà Trai' : g.side === 'nha_gai' ? 'Nhà Gái' : 'Chung';
      const statusName =
        g.status === 'xac_nhan'
          ? 'Đi được'
          : g.status === 'da_gui'
          ? 'Đã gửi thiệp'
          : g.status === 'chua_chac'
          ? 'Chưa chắc'
          : g.status === 'tu_choi'
          ? 'Bận'
          : 'Chưa gửi';
      return `${idx + 1},"${g.name}","${sideName}","${g.relationshipDetail}",${g.count},"${g.phone || ''}","${statusName}","${g.tableNumber || ''}","${g.note || ''}"`;
    });

    const csvContent = '﻿' + [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Danh_sach_khach_cuoi_${weddingInfo.groomName}_${weddingInfo.brideName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopySummary = async () => {
    const summaryText = `📊 BÁO CÁO CỖ CƯỚI: ${weddingInfo.groomName} & ${weddingInfo.brideName}
⏰ Ngày: ${weddingInfo.weddingDate} lúc ${weddingInfo.ceremonyTime}
📍 Địa điểm: ${weddingInfo.venueName}

• Tổng số khách mời: ${totalHeadcount} người (${totalInvites} lượt thiệp)
• Đã xác nhận tham dự: ${confirmedHeadcount} người
• Đang chờ phản hồi: ${pendingHeadcount} người
• Dự kiến cần đặt: ${totalTables} bàn (${capacity} người/bàn)
  - Bàn đã chốt chắc chắn: ${confirmedTables} bàn
• Phân bổ theo phe:
  - Nhà Trai: ${nhaTraiCount} người (~${Math.ceil(nhaTraiCount / capacity)} bàn)
  - Nhà Gái: ${nhaGaiCount} người (~${Math.ceil(nhaGaiCount / capacity)} bàn)
  - Chung: ${chungCount} người
• Phân bổ theo nhóm:
  - Họ hàng / Người thân: ${catBreakdown.ho_hang} người
  - Bạn bè: ${catBreakdown.ban_be} người
  - Đồng nghiệp: ${catBreakdown.dong_nghiep} người
  - Đối tác / VIP: ${catBreakdown.vip} người`;

    try {
      await navigator.clipboard.writeText(summaryText);
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="flex flex-col h-full bg-cream text-stone-800 overflow-hidden">
      <TabHeader
        title="Bàn tiệc & Cỗ cưới"
        subtitle={`${totalTables} bàn dự kiến · ${capacity} người/bàn`}
        actions={
          <button onClick={openSettings} className="btn btn-ghost btn-icon" title="Cài đặt đám cưới" aria-label="Cài đặt">
            <Settings className="w-[18px] h-[18px]" />
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto p-4 space-y-4 overscroll-contain pb-8">
        {/* Wedding hero */}
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-wine-700 via-wine-800 to-stone-900 text-white p-5 shadow-wine">
          <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-gold-400/20 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-10 w-48 h-48 rounded-full bg-wine-400/20 blur-2xl pointer-events-none" />
          <div className="relative">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold-300">Lễ thành hôn</div>
            <div className="font-serif text-2xl mt-1 leading-tight">
              {weddingInfo.groomName}
              <span className="italic text-gold-300 mx-1.5">&</span>
              {weddingInfo.brideName}
            </div>
            <div className="mt-3 flex flex-col gap-1 text-xs text-white/80">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-gold-300" />
                {weddingInfo.weddingDate} · {weddingInfo.ceremonyTime}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-gold-300 shrink-0" />
                <span className="truncate">{weddingInfo.venueName}</span>
              </span>
            </div>
          </div>
        </div>

        {/* KPI grid */}
        <div className="grid grid-cols-2 gap-3">
          <Kpi
            icon={<Users className="w-4 h-4" />}
            tile="bg-wine-50 text-wine-700"
            label="Tổng dự kiến"
            value={totalHeadcount}
            unit="khách"
            caption={`Từ ${totalInvites} lượt thiệp mời`}
          />
          <Kpi
            icon={<UtensilsCrossed className="w-4 h-4" />}
            tile="bg-gold-50 text-gold-600"
            label="Ước tính bàn"
            value={`~${totalTables}`}
            unit="bàn"
            caption={`Chuẩn ${capacity} người/mâm`}
          />
          <Kpi
            icon={<CheckCircle2 className="w-4 h-4" />}
            tile="bg-emerald-50 text-emerald-600"
            label="Đã chốt đi"
            value={confirmedHeadcount}
            unit="người"
            caption={`Chắc chắn ${confirmedTables} bàn`}
            valueClass="text-emerald-700"
          />
          <Kpi
            icon={<Clock className="w-4 h-4" />}
            tile="bg-sky-50 text-sky-600"
            label="Đang chờ"
            value={pendingHeadcount}
            unit="người"
            caption="Cần theo dõi trước ngày cưới"
          />
        </div>

        {/* Chart */}
        <div className="card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <IconTile className="w-8 h-8 rounded-lg bg-wine-50 text-wine-700">
              <PieChartIcon className="w-4 h-4" />
            </IconTile>
            <div>
              <h2 className="text-sm font-semibold text-stone-900">Tỷ lệ khách mời</h2>
              <p className="text-[11px] text-stone-500">Phân bổ theo số người</p>
            </div>
          </div>

          <div className="seg">
            {CHART_MODES.map((m) => (
              <button key={m.id} onClick={() => setChartMode(m.id)} className={`seg-btn ${chartMode === m.id ? 'seg-on' : ''}`}>
                {m.label}
              </button>
            ))}
          </div>

          {currentChartData.length === 0 ? (
            <div className="h-44 flex items-center justify-center text-xs text-stone-400">Chưa có dữ liệu khách mời để vẽ biểu đồ</div>
          ) : (
            <div>
              <div className="relative h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={currentChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={56}
                      outerRadius={82}
                      paddingAngle={3}
                      cornerRadius={4}
                      dataKey="value"
                      animationDuration={700}
                      stroke="none"
                    >
                      {currentChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0];
                          const percent = totalHeadcount > 0 ? ((Number(data.value) / totalHeadcount) * 100).toFixed(1) : '0';
                          return (
                            <div className="bg-stone-900/95 backdrop-blur-md text-white text-xs px-3 py-2 rounded-xl shadow-lift">
                              <div className="font-semibold">{data.name}</div>
                              <div className="text-stone-300 tabular-nums mt-0.5">
                                {data.value} người ({percent}%)
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider">Tổng</span>
                  <span className="font-serif text-3xl text-stone-900 leading-none mt-0.5">{totalHeadcount}</span>
                  <span className="text-[10px] text-stone-500 mt-0.5">người</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1.5 pt-3 border-t border-stone-100">
                {currentChartData.map((item, idx) => {
                  const percent = totalHeadcount > 0 ? ((item.value / totalHeadcount) * 100).toFixed(0) : '0';
                  return (
                    <div key={idx} className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg bg-stone-50 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-stone-700 truncate text-[11px] font-medium">{item.name}</span>
                      </div>
                      <div className="tabular-nums text-stone-900 font-semibold shrink-0 text-[11px]">
                        {item.value} <span className="text-stone-400 font-normal">({percent}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Side breakdown */}
        <div className="card p-4 space-y-3.5">
          <h2 className="text-sm font-semibold text-stone-900">Bàn cỗ theo phe</h2>
          <Bar
            label="Nhà Trai (Chú rể)"
            value={nhaTraiCount}
            total={totalHeadcount}
            tables={Math.ceil(nhaTraiCount / capacity)}
            color="bg-sky-600"
            labelClass="text-sky-800"
          />
          <Bar
            label="Nhà Gái (Cô dâu)"
            value={nhaGaiCount}
            total={totalHeadcount}
            tables={Math.ceil(nhaGaiCount / capacity)}
            color="bg-pink-600"
            labelClass="text-pink-800"
          />
          {chungCount > 0 && (
            <Bar label="Khách chung" value={chungCount} total={totalHeadcount} color="bg-stone-500" labelClass="text-stone-700" />
          )}
        </div>

        {/* Actions */}
        <div className="space-y-2 pb-4">
          <button onClick={handleCopySummary} className="btn btn-primary btn-md w-full">
            {copiedSummary ? (
              <>
                <Check className="w-4 h-4" />
                <span>Đã sao chép báo cáo</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Sao chép báo cáo cỗ</span>
              </>
            )}
          </button>
          <button onClick={handleExportCSV} className="btn btn-secondary btn-md w-full">
            <Download className="w-4 h-4" />
            <span>Xuất danh sách Excel / CSV</span>
          </button>
        </div>
      </div>

      {/* Wedding settings */}
      <Modal
        open={isEditingSettings}
        onClose={() => setIsEditingSettings(false)}
        title="Thông tin đám cưới"
        subtitle="Dùng cho thiệp mời và báo cáo cỗ"
        icon={
          <IconTile className="bg-wine-50 text-wine-700">
            <Settings className="w-[18px] h-[18px]" />
          </IconTile>
        }
        footer={
          <div className="flex gap-2">
            <button type="button" onClick={() => setIsEditingSettings(false)} className="btn btn-secondary btn-md flex-1">
              Hủy
            </button>
            <button type="submit" form="wedding-settings-form" className="btn btn-primary btn-md flex-[1.4]">
              <Check className="w-4 h-4" />
              <span>Lưu thay đổi</span>
            </button>
          </div>
        }
      >
        <form id="wedding-settings-form" onSubmit={handleSaveSettings} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Chú rể</label>
              <input type="text" value={tempInfo.groomName} onChange={(e) => setTempInfo({ ...tempInfo, groomName: e.target.value })} className="field" />
            </div>
            <div>
              <label className="label">Cô dâu</label>
              <input type="text" value={tempInfo.brideName} onChange={(e) => setTempInfo({ ...tempInfo, brideName: e.target.value })} className="field" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Ngày cưới</label>
              <input type="text" value={tempInfo.weddingDate} onChange={(e) => setTempInfo({ ...tempInfo, weddingDate: e.target.value })} className="field" placeholder="dd/mm/yyyy" />
            </div>
            <div>
              <label className="label">Giờ làm lễ</label>
              <input type="text" value={tempInfo.ceremonyTime} onChange={(e) => setTempInfo({ ...tempInfo, ceremonyTime: e.target.value })} className="field" placeholder="11:00" />
            </div>
          </div>

          <div>
            <label className="label">Địa điểm</label>
            <input type="text" value={tempInfo.venueName} onChange={(e) => setTempInfo({ ...tempInfo, venueName: e.target.value })} className="field" />
          </div>

          <div>
            <label className="label">Số người / bàn tiệc</label>
            <select value={tempInfo.tableCapacity} onChange={(e) => setTempInfo({ ...tempInfo, tableCapacity: Number(e.target.value) })} className="field select">
              <option value={10}>10 người / bàn (Tiêu chuẩn)</option>
              <option value={6}>6 người / bàn (Bàn nhỏ)</option>
              <option value={12}>12 người / bàn</option>
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
};
