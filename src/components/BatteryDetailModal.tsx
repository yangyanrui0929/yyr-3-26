import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { BUILDING_STATS, DAY_THRESHOLD, TICK_INTERVAL } from '../utils/constants';
import { X, Zap, Battery, AlertTriangle, Clock, Sun, Moon, TrendingUp, TrendingDown } from 'lucide-react';

export const BatteryDetailModal: React.FC = () => {
  const {
    showBatteryDetail,
    closeBatteryDetail,
    selectedBattery,
    grid,
    storedPower,
    maxStorage,
    totalGeneration,
    totalConsumption,
    dayTime,
    repairCell,
  } = useGameStore();

  if (!showBatteryDetail || !selectedBattery) return null;

  const cell = grid[selectedBattery.y][selectedBattery.x];
  if (cell.type !== 'battery') return null;

  const isDay = dayTime < DAY_THRESHOLD;
  const netPower = totalGeneration - totalConsumption;

  const workingBatteries = grid.flat().filter(
    (c) => c.type === 'battery' && !c.faulty
  ).length;
  const totalBatteries = grid.flat().filter(
    (c) => c.type === 'battery'
  ).length;

  const perBatteryStored = workingBatteries > 0 ? storedPower / workingBatteries : 0;
  const perBatteryMax = BUILDING_STATS.battery.storage;
  const perBatteryNet = workingBatteries > 0 ? netPower / workingBatteries : 0;

  const storagePercent = maxStorage > 0 ? (storedPower / maxStorage) * 100 : 0;
  const perBatteryPercent = perBatteryMax > 0 ? (perBatteryStored / perBatteryMax) * 100 : 0;

  let estimatedChargeTime: string = '-';
  if (isDay) {
    if (storedPower >= maxStorage) {
      estimatedChargeTime = '已充满';
    } else if (netPower <= 0) {
      estimatedChargeTime = '净电力不足，无法充电';
    } else {
      const chargePerTick = netPower * 0.3;
      const remaining = maxStorage - storedPower;
      const ticksNeeded = remaining / chargePerTick;
      const msNeeded = ticksNeeded * TICK_INTERVAL;
      const seconds = Math.ceil(msNeeded / 1000);
      if (seconds < 60) {
        estimatedChargeTime = `约 ${seconds} 秒`;
      } else {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        estimatedChargeTime = `约 ${minutes} 分 ${secs} 秒`;
      }
    }
  }

  let nightSupportTime: string = '-';
  let nightDischargePerTick = 0;
  if (netPower >= 0) {
    nightSupportTime = '夜间发电充足，持续供电中';
    nightDischargePerTick = 0;
  } else {
    const deficit = -netPower;
    nightDischargePerTick = deficit * 0.5;
    if (storedPower <= 0) {
      nightSupportTime = '电量已耗尽';
    } else {
      const ticksSupported = storedPower / nightDischargePerTick;
      const msSupported = ticksSupported * TICK_INTERVAL;
      const seconds = Math.ceil(msSupported / 1000);
      if (seconds < 60) {
        nightSupportTime = `约 ${seconds} 秒`;
      } else {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        nightSupportTime = `约 ${minutes} 分 ${secs} 秒`;
      }
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={closeBatteryDetail}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-[scaleIn_0.3s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-6 text-white relative">
          <button
            onClick={closeBatteryDetail}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3">
            <div className="text-5xl">🔋</div>
            <div>
              <h2 className="text-2xl font-bold">蓄电池详情</h2>
              <p className="text-amber-100 text-sm mt-1 flex items-center gap-2">
                {isDay ? (
                  <><Sun className="w-4 h-4" /> 白天模式</>
                ) : (
                  <><Moon className="w-4 h-4" /> 夜晚模式</>
                )}
                {cell.faulty && (
                  <span className="ml-2 bg-red-500 text-white px-2 py-0.5 rounded-full text-xs">
                    ⚠️ 故障中
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div className="bg-amber-50 rounded-xl p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600 flex items-center gap-1">
                <Battery className="w-4 h-4" /> 全岛蓄电量
              </span>
              <span className="text-lg font-bold text-amber-700">
                {Math.round(storedPower)} / {maxStorage}
              </span>
            </div>
            <div className="w-full h-3 bg-amber-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${storagePercent}%`,
                  background:
                    storagePercent > 60
                      ? 'linear-gradient(90deg, #34D399, #10B981)'
                      : storagePercent > 30
                      ? 'linear-gradient(90deg, #FBBF24, #F59E0B)'
                      : 'linear-gradient(90deg, #F87171, #EF4444)',
                }}
              />
            </div>
            {totalBatteries > 1 && (
              <p className="text-xs text-gray-500 mt-2">
                共 {totalBatteries} 组蓄电池（{workingBatteries} 组正常），按平均分摊显示单组数据
              </p>
            )}
          </div>

          {totalBatteries > 1 && (
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600 flex items-center gap-1">
                  <Battery className="w-4 h-4" /> 本组分摊电量
                </span>
                <span className="text-lg font-bold text-gray-700">
                  {Math.round(perBatteryStored)} / {perBatteryMax}
                </span>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${perBatteryPercent}%`,
                    background:
                      perBatteryPercent > 60
                        ? 'linear-gradient(90deg, #34D399, #10B981)'
                        : perBatteryPercent > 30
                        ? 'linear-gradient(90deg, #FBBF24, #F59E0B)'
                        : 'linear-gradient(90deg, #F87171, #EF4444)',
                  }}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className={`rounded-xl p-4 text-center ${
              netPower >= 0 ? 'bg-green-50' : 'bg-red-50'
            }`}>
              <div className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center ${
                netPower >= 0 ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {netPower >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                )}
              </div>
              <p className={`text-2xl font-bold ${
                netPower >= 0 ? 'text-green-700' : 'text-red-600'
              }`}>
                {netPower >= 0 ? '+' : ''}{netPower.toFixed(1)}
              </p>
              <p className="text-xs text-gray-500 mt-1">本轮净电力</p>
              {totalBatteries > 1 && (
                <p className="text-xs text-gray-400 mt-1">
                  单组分摊: {perBatteryNet >= 0 ? '+' : ''}{perBatteryNet.toFixed(1)}
                </p>
              )}
            </div>

            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <div className="w-8 h-8 rounded-full bg-blue-100 mx-auto mb-2 flex items-center justify-center">
                <Zap className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-blue-700">
                {maxStorage}
              </p>
              <p className="text-xs text-gray-500 mt-1">最大总容量</p>
              {totalBatteries > 1 && (
                <p className="text-xs text-gray-400 mt-1">
                  单组容量: {perBatteryMax}
                </p>
              )}
            </div>
          </div>

          {isDay ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-yellow-600" />
                <h3 className="text-sm font-bold text-yellow-800">预计充满时间</h3>
              </div>
              <p className="text-xl font-bold text-yellow-700">{estimatedChargeTime}</p>
              <p className="text-xs text-gray-500 mt-1">
                充电效率: 净电力 × 0.3 / 每 tick（当前 +{(netPower * 0.3).toFixed(2)} 电/tick）
              </p>
            </div>
          ) : (
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-indigo-800">夜晚预计支撑时间</h3>
              </div>
              <p className="text-xl font-bold text-indigo-700">{nightSupportTime}</p>
              <p className="text-xs text-gray-500 mt-1">
                放电速率: 净耗电 × 0.5 / 每 tick（当前 -{nightDischargePerTick.toFixed(2)} 电/tick）
              </p>
            </div>
          )}

          <div className={`rounded-xl p-4 border ${
            cell.faulty
              ? 'bg-red-50 border-red-200'
              : 'bg-green-50 border-green-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {cell.faulty ? (
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
                <h3 className={`text-sm font-bold ${
                  cell.faulty ? 'text-red-800' : 'text-green-800'
                }`}>
                  {cell.faulty ? '本组状态：故障 ⚠️' : '本组状态：运行正常'}
                </h3>
              </div>
              {cell.faulty && (
                <button
                  onClick={() => {
                    repairCell(selectedBattery.x, selectedBattery.y);
                  }}
                  className="bg-red-500 hover:bg-red-600 text-white text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                >
                  🔧 维修
                </button>
              )}
            </div>
            {cell.faulty && (
              <p className="text-xs text-red-600 mt-2">
                故障时无法参与充放电，点击右侧按钮立即维修
              </p>
            )}
          </div>

          <button
            onClick={closeBatteryDetail}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold py-3 rounded-xl shadow-lg transition-all duration-200 hover:scale-[1.02]"
          >
            关闭详情
          </button>
        </div>
      </div>

      <style>{`
        @keyframes scaleIn {
          from { transform: scale(0.8); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};
