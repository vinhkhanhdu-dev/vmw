import React, { useState } from 'react';
import {
  Users,
  UtensilsCrossed,
  CheckCircle2,
  Clock,
  Download,
  Share2,
  Settings,
  Calendar,
  MapPin,
  Heart,
  Copy,
  Check,
  PieChart as PieChartIcon
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from 'recharts';
import { Guest, WeddingInfo } from '../types';

interface TablesTabProps {
  guests: Guest[];
  weddingInfo: WeddingInfo;
  onUpdateWeddingInfo: (info: WeddingInfo) => void;
}

export const TablesTab: React.FC<TablesTabProps> = ({
  guests,
  weddingInfo,
  onUpdateWeddingInfo,
}) => {
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [tempInfo, setTempInfo] = useState(weddingInfo);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [chartMode, setChartMode] = useState<'group' | 'side' | 'status'>('group');

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
  const nhaTraiCount = guests
    .filter((g) => g.side === 'nha_trai')
    .reduce((sum, g) => sum + (g.count || 1), 0);
  const nhaGaiCount = guests
    .filter((g) => g.side === 'nha_gai')
    .reduce((sum, g) => sum + (g.count || 1), 0);
  const chungCount = guests
    .filter((g) => g.side === 'chung')
    .reduce((sum, g) => sum + (g.count || 1), 0);

  // Category Breakdown
  const catBreakdown = {
    ho_hang: guests.filter((g) => g.relationshipCategory === 'ho_hang').reduce((s, g) => s + (g.count || 1), 0),
    ban_be: guests.filter((g) => g.relationshipCategory === 'ban_be').reduce((s, g) => s + (g.count || 1), 0),
    dong_nghiep: guests.filter((g) => g.relationshipCategory === 'dong_nghiep').reduce((s, g) => s + (g.count || 1), 0),
    vip: guests.filter((g) => g.relationshipCategory === 'vip').reduce((s, g) => s + (g.count || 1), 0),
    khac: guests.filter((g) => g.relationshipCategory === 'khac').reduce((s, g) => s + (g.count || 1), 0),
  };

  // Recharts Pie Chart Data Sources
  const groupChartData = [
    { name: 'Họ hàng / Người thân', value: catBreakdown.ho_hang, color: '#9E1B32' },
    { name: 'Bạn bè', value: catBreakdown.ban_be, color: '#D97706' },
    { name: 'Đồng nghiệp', value: catBreakdown.dong_nghiep, color: '#059669' },
    { name: 'Đối tác / VIP', value: catBreakdown.vip, color: '#4338CA' },
    { name: 'Khác', value: catBreakdown.khac, color: '#64748B' },
  ].filter((item) => item.value > 0);

  const sideChartData = [
    { name: 'Nhà Trai (Chú rể)', value: nhaTraiCount, color: '#2563EB' },
    { name: 'Nhà Gái (Cô dâu)', value: nhaGaiCount, color: '#DB2777' },
    { name: 'Khách chung', value: chungCount, color: '#64748B' },
  ].filter((item) => item.value > 0);

  const statusChartData = [
    { name: 'Đi được (Đã chốt)', value: confirmedHeadcount, color: '#10B981' },
    { name: 'Đang chờ / Chưa gửi', value: pendingHeadcount, color: '#F59E0B' },
    { name: 'Bận không đi', value: declinedHeadcount, color: '#94A3B8' },
  ].filter((item) => item.value > 0);

  const currentChartData =
    chartMode === 'group'
      ? groupChartData
      : chartMode === 'side'
      ? sideChartData
      : statusChartData;

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

    const csvContent = '\uFEFF' + [headers, ...rows].join('\n');
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
    <div className="flex flex-col h-full bg-[#FAF7F2] text-stone-800 overflow-hidden">
      {/* Header Info - Pinned Top Bar */}
      <div className="p-4 bg-white border-b border-stone-200/80 shrink-0 z-10 shadow-2xs">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-stone-900">Quản Lý Bàn Tiệc & Cỗ Cưới</h1>
            <p className="text-[11px] text-stone-500">
              Đám cưới {weddingInfo.groomName} & {weddingInfo.brideName}
            </p>
          </div>
          <button
            onClick={() => setIsEditingSettings(!isEditingSettings)}
            className="p-2 text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Cài đặt</span>
          </button>
        </div>

        {/* Wedding Settings Edit Form */}
        {isEditingSettings && (
          <form onSubmit={handleSaveSettings} className="mt-3 p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2.5 text-xs">
            <div className="font-semibold text-stone-800">Thông tin đám cưới:</div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-stone-500">Tên Chú Rể:</label>
                <input
                  type="text"
                  value={tempInfo.groomName}
                  onChange={(e) => setTempInfo({ ...tempInfo, groomName: e.target.value })}
                  className="w-full p-2 bg-white border border-stone-300 rounded-md text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] text-stone-500">Tên Cô Dâu:</label>
                <input
                  type="text"
                  value={tempInfo.brideName}
                  onChange={(e) => setTempInfo({ ...tempInfo, brideName: e.target.value })}
                  className="w-full p-2 bg-white border border-stone-300 rounded-md text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-stone-500">Ngày cưới:</label>
                <input
                  type="text"
                  value={tempInfo.weddingDate}
                  onChange={(e) => setTempInfo({ ...tempInfo, weddingDate: e.target.value })}
                  className="w-full p-2 bg-white border border-stone-300 rounded-md text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] text-stone-500">Giờ làm lễ:</label>
                <input
                  type="text"
                  value={tempInfo.ceremonyTime}
                  onChange={(e) => setTempInfo({ ...tempInfo, ceremonyTime: e.target.value })}
                  className="w-full p-2 bg-white border border-stone-300 rounded-md text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-stone-500">Địa điểm nhà hàng:</label>
              <input
                type="text"
                value={tempInfo.venueName}
                onChange={(e) => setTempInfo({ ...tempInfo, venueName: e.target.value })}
                className="w-full p-2 bg-white border border-stone-300 rounded-md text-xs"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-[10px] text-stone-500">Số người / bàn tiệc:</label>
              <select
                value={tempInfo.tableCapacity}
                onChange={(e) => setTempInfo({ ...tempInfo, tableCapacity: Number(e.target.value) })}
                className="p-1.5 bg-white border border-stone-300 rounded-md text-xs"
              >
                <option value={10}>10 người / bàn (Tiêu chuẩn)</option>
                <option value={6}>6 người / bàn (Bàn nhỏ)</option>
                <option value={12}>12 người / bàn</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsEditingSettings(false)}
                className="px-3 py-1.5 text-stone-600 hover:text-stone-800 text-xs"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 bg-rose-800 hover:bg-rose-900 text-white rounded-md text-xs font-medium"
              >
                Lưu thay đổi
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Scrollable Content Body */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 overscroll-contain pb-8">
        {/* KPI Cards Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-white rounded-xl p-3 border border-stone-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-stone-500 text-xs">
              <span>Tổng dự kiến</span>
              <Users className="w-4 h-4 text-rose-700" />
            </div>
            <div className="text-2xl font-bold text-stone-900 mt-1 font-mono">
              {totalHeadcount} <span className="text-xs font-normal text-stone-500">khách</span>
            </div>
            <div className="text-[11px] text-stone-500 mt-0.5">
              Từ {totalInvites} lượt thiệp mời
            </div>
          </div>

          <div className="bg-white rounded-xl p-3 border border-stone-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-stone-500 text-xs">
              <span>Ước tính bàn cỗ</span>
              <UtensilsCrossed className="w-4 h-4 text-amber-700" />
            </div>
            <div className="text-2xl font-bold text-stone-900 mt-1 font-mono">
              ~{totalTables} <span className="text-xs font-normal text-stone-500">bàn</span>
            </div>
            <div className="text-[11px] text-stone-500 mt-0.5">
              Chuẩn {capacity} người/mâm
            </div>
          </div>

          <div className="bg-white rounded-xl p-3 border border-stone-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-stone-500 text-xs">
              <span>Đã chốt đi</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-emerald-700 mt-1 font-mono">
              {confirmedHeadcount} <span className="text-xs font-normal text-stone-500">người</span>
            </div>
            <div className="text-[11px] text-stone-500 mt-0.5">
              Đủ chắc chắn {confirmedTables} bàn
            </div>
          </div>

          <div className="bg-white rounded-xl p-3 border border-stone-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-stone-500 text-xs">
              <span>Đang chờ / Chưa rõ</span>
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-stone-800 mt-1 font-mono">
              {pendingHeadcount} <span className="text-xs font-normal text-stone-500">người</span>
            </div>
            <div className="text-[11px] text-stone-500 mt-0.5">
              Cần theo dõi trước ngày cưới
            </div>
          </div>
        </div>

        {/* Interactive Recharts Pie Chart Section */}
        <div className="bg-white rounded-2xl p-4 border border-stone-200/90 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <PieChartIcon className="w-4 h-4 text-rose-800" />
              <h2 className="text-xs font-semibold text-stone-900 uppercase tracking-wider">
                Tỷ Lệ Khách Mời (Biểu Đồ Tròn)
              </h2>
            </div>
          </div>

          {/* Chart Segment Controls */}
          <div className="flex p-0.5 bg-stone-100 rounded-lg text-xs">
            <button
              onClick={() => setChartMode('group')}
              className={`flex-1 py-1.5 px-2 text-center font-medium rounded-md transition-colors ${
                chartMode === 'group'
                  ? 'bg-white text-rose-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Nhóm Quan Hệ
            </button>
            <button
              onClick={() => setChartMode('side')}
              className={`flex-1 py-1.5 px-2 text-center font-medium rounded-md transition-colors ${
                chartMode === 'side'
                  ? 'bg-white text-rose-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Theo Phe
            </button>
            <button
              onClick={() => setChartMode('status')}
              className={`flex-1 py-1.5 px-2 text-center font-medium rounded-md transition-colors ${
                chartMode === 'status'
                  ? 'bg-white text-rose-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Trạng Thái
            </button>
          </div>

          {/* Recharts Pie Chart Viewport */}
          {currentChartData.length === 0 ? (
            <div className="h-44 flex items-center justify-center text-xs text-stone-400">
              Chưa có dữ liệu khách mời để vẽ biểu đồ
            </div>
          ) : (
            <div className="relative">
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={currentChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={78}
                      paddingAngle={3}
                      dataKey="value"
                      animationDuration={700}
                    >
                      {currentChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0];
                          const percent = totalHeadcount > 0 ? ((Number(data.value) / totalHeadcount) * 100).toFixed(1) : '0';
                          return (
                            <div className="bg-stone-900/95 backdrop-blur-md text-white text-xs px-2.5 py-1.5 rounded-lg shadow-lg border border-white/10 font-sans">
                              <div className="font-semibold">{data.name}</div>
                              <div className="text-stone-300 font-mono mt-0.5">
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

                {/* Donut Center Display */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] text-stone-400 font-medium uppercase tracking-wider">Tổng cộng</span>
                  <span className="text-xl font-bold text-stone-900 font-mono">{totalHeadcount}</span>
                  <span className="text-[10px] text-stone-500">người</span>
                </div>
              </div>

              {/* Clean Legend Pill Grid */}
              <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-stone-100">
                {currentChartData.map((item, idx) => {
                  const percent = totalHeadcount > 0 ? ((item.value / totalHeadcount) * 100).toFixed(0) : '0';
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-lg bg-stone-50 text-xs border border-stone-200/50"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-stone-700 truncate text-[11px] font-medium">{item.name}</span>
                      </div>
                      <div className="font-mono text-stone-900 font-semibold shrink-0 text-[11px] ml-1">
                        {item.value} <span className="text-stone-400 text-[10px] font-normal">({percent}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Side Distribution Summary */}
        <div className="bg-white rounded-xl p-3.5 border border-stone-200/80 shadow-2xs space-y-2.5">
          <h2 className="text-xs font-semibold text-stone-800 uppercase tracking-wider">
            Chi Tiết Bàn Cỗ Theo Phe
          </h2>

          <div className="space-y-2 text-xs">
            <div>
              <div className="flex justify-between font-medium mb-1">
                <span className="text-blue-800 font-semibold">Nhà Trai (Chú rể)</span>
                <span className="font-mono">{nhaTraiCount} người (~{Math.ceil(nhaTraiCount / capacity)} bàn)</span>
              </div>
              <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${totalHeadcount > 0 ? (nhaTraiCount / totalHeadcount) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-medium mb-1">
                <span className="text-pink-800 font-semibold">Nhà Gái (Cô dâu)</span>
                <span className="font-mono">{nhaGaiCount} người (~{Math.ceil(nhaGaiCount / capacity)} bàn)</span>
              </div>
              <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-pink-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${totalHeadcount > 0 ? (nhaGaiCount / totalHeadcount) * 100 : 0}%` }}
                />
              </div>
            </div>

            {chungCount > 0 && (
              <div>
                <div className="flex justify-between font-medium mb-1">
                  <span className="text-stone-700 font-semibold">Khách chung hai bạn</span>
                  <span className="font-mono">{chungCount} người</span>
                </div>
                <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-stone-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${totalHeadcount > 0 ? (chungCount / totalHeadcount) * 100 : 0}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1 pb-4">
          <button
            onClick={handleCopySummary}
            className="w-full min-h-[44px] bg-rose-800 hover:bg-rose-900 active:scale-98 text-white rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all shadow-xs"
          >
            {copiedSummary ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>Đã sao chép báo cáo cỗ!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Sao chép báo cáo cỗ (gửi người nhà/nhà hàng)</span>
              </>
            )}
          </button>

          <button
            onClick={handleExportCSV}
            className="w-full min-h-[44px] bg-white hover:bg-stone-50 active:scale-98 text-stone-800 border border-stone-300 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all"
          >
            <Download className="w-4 h-4 text-stone-600" />
            <span>Xuất danh sách ra file Excel / CSV</span>
          </button>
        </div>
      </div>
    </div>
  );
};
