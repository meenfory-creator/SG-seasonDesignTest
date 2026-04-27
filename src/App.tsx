import React, { useEffect, useRef, useState } from 'react';
import uiWoodBg from './assets/ui-wood-bg.png';

type Quality = string;
type Quadrant = 'wind' | 'forest' | 'mountain' | 'fire';
type MergeTab = '易形' | '升品';

type BingshuTemplate = {
  id: number;
  type: string;
  name: string;
  shape: number[][];
  color: string;
  description: string;
};

type InventoryPiece = BingshuTemplate & { uid: string; quality: Quality };
type PlacedPiece = InventoryPiece & { startR: number; startC: number };

type ExpansionPiece = {
  id: string | number;
  uid: string;
  name: string;
  shape: number[][];
  color: string;
  type?: string;
  description?: string;
  quality?: Quality;
};
type PlacedExpansion = ExpansionPiece & { startR: number; startC: number };

type Seal = {
  id: string;
  name: string;
  color: string;
  style: string;
  effect: string;
};

type HoverPos = { r: number; c: number };
type ActionMenu = {
  x: number;
  y: number;
  uid: string;
  type: 'bingshu' | 'merge' | 'expansion';
};

type CoreStatus = Record<Quadrant, boolean>;
type EquippedTactics = Record<Quadrant, number | null>;
type EquippedSeals = Record<Quadrant, (Seal | null)[]>;
type SealCounts = Record<string, number>;

type LevelReward = {
  level: number;
  rewards: Array<{ id: string; name: string; type: string }>;
};

type AbilityConfig = {
  id: string;
  reqPieceId: number;
  name: string;
  desc: string;
  total: number;
};

type DiamondButtonProps = {
  label: string;
  onClick: () => void;
  isActive: boolean;
};

type LevelDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  currentLevel: number;
  exp: number;
  expToNextLevel: number;
  claimedLevels: number[];
  onClaim: (lvl: number) => void;
};

type InventoryDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  inventory: InventoryPiece[];
  onPlace: (item: InventoryPiece) => void;
};

type AbilitiesDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  abilities: AbilityConfig[];
  uses: Record<string, number>;
  onUse: (id: string) => void;
};

// ==========================================
// 1. 数据定义与常量
// ==========================================
const BINGSHU_TEMPLATES: BingshuTemplate[] = [
  {
    id: 1001,
    type: '1格',
    name: '木材产量',
    shape: [[1]],
    color: 'bg-amber-700',
    description: '置入舆地后，木材产量增加2000/时',
  },
  {
    id: 1002,
    type: '1格',
    name: '铁矿采集',
    shape: [[1]],
    color: 'bg-stone-600',
    description: '置入舆地后，铁矿产量增加1500/时',
  },
  {
    id: 2001,
    type: '2格',
    name: '获取粮仓',
    shape: [[1, 1]],
    color: 'bg-red-800',
    description: '置入舆地后，粮食产量增加4500/时',
  },
  {
    id: 3001,
    type: '3格',
    name: '突进战法',
    shape: [[1, 1, 1]],
    color: 'bg-purple-800',
    description: '置入舆地后，行军速度提升10%',
  },
  {
    id: 4001,
    type: '4格',
    name: '奇门阵(T)',
    shape: [
      [1, 1, 1],
      [0, 1, 0],
    ],
    color: 'bg-indigo-900',
    description: '置入舆地后，部队战损降低5%',
  },
];

const LEVEL_REWARDS: LevelReward[] = Array.from({ length: 20 }, (_, i) => ({
  level: i + 1,
  rewards: [
    { id: 'ext', name: i % 5 === 2 ? '舆地拓展' : '百战兵符', type: 'square' },
    { id: 'item', name: i % 2 === 0 ? '鸡腿' : '战法影本', type: 'square' },
  ],
}));

// ==========================================
// 2. 基础 UI 组件
// ==========================================
function DiamondButton({ label, onClick, isActive }: DiamondButtonProps) {
  return (
    <div
      className="flex flex-col items-center gap-2 group cursor-pointer"
      onClick={onClick}
    >
      <div className="relative w-12 h-12 flex items-center justify-center transition-transform group-hover:scale-110">
        <div
          className={`absolute inset-0 border-2 rotate-45 transition-colors shadow-lg
          ${
            isActive
              ? 'bg-amber-900/80 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.6)]'
              : 'bg-stone-800 border-stone-600 group-hover:border-amber-500 group-hover:bg-stone-700'
          }`}
        ></div>
        <span
          className={`relative z-10 text-xl font-bold transition-colors ${
            isActive
              ? 'text-amber-400'
              : 'text-stone-300 group-hover:text-amber-500'
          }`}
        >
          {label.charAt(0)}
        </span>
      </div>
      <span
        className={`text-xs transition-colors font-sans ${
          isActive
            ? 'text-amber-500 font-bold'
            : 'text-stone-500 group-hover:text-stone-300'
        }`}
      >
        {label}
      </span>
    </div>
  );
}

function LevelDrawer({
  isOpen,
  onClose,
  currentLevel,
  exp,
  expToNextLevel,
  claimedLevels,
  onClaim,
}: LevelDrawerProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60"></div>
      <div
        className="relative w-96 bg-stone-900 border-l border-stone-700 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-stone-700">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-amber-500">推演等级</h2>
            <button
              onClick={onClose}
              className="text-stone-400 hover:text-white text-2xl"
            >
              ×
            </button>
          </div>
          <div className="bg-stone-800/50 p-4 rounded-lg border border-stone-700">
            <div className="flex justify-between text-xs mb-2">
              <span className="text-stone-400">当前进度</span>
              <span className="text-amber-500 font-mono">
                {exp}/{expToNextLevel}
              </span>
            </div>
            <div className="w-full bg-stone-950 h-3 rounded-full overflow-hidden border border-stone-800 p-0.5">
              <div
                className="bg-gradient-to-r from-amber-700 to-amber-500 h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                style={{ width: `${(exp / expToNextLevel) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {LEVEL_REWARDS.map((item) => {
            const isReached = item.level <= currentLevel;
            const isClaimed = claimedLevels.includes(item.level);
            return (
              <div
                key={item.level}
                className={`p-4 rounded border relative overflow-hidden transition-colors ${
                  isReached
                    ? 'bg-stone-800 border-amber-900/50'
                    : 'bg-stone-900/50 border-stone-800 opacity-60'
                }`}
              >
                <div className="flex justify-between items-center mb-3">
                  <span
                    className={`font-bold ${
                      isReached ? 'text-amber-500' : 'text-stone-500'
                    }`}
                  >
                    等级 {item.level}
                  </span>
                  {isReached ? (
                    isClaimed ? (
                      <div className="absolute -right-2 -top-2 opacity-40 rotate-12">
                        <div className="border-4 border-red-900 text-red-900 font-bold px-2 py-1 text-sm rounded uppercase tracking-tighter">
                          已领取
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => onClaim(item.level)}
                        className="px-4 py-1 bg-amber-600 hover:bg-amber-500 text-white text-xs rounded font-bold shadow-lg transition-transform active:scale-95"
                      >
                        领 取
                      </button>
                    )
                  ) : (
                    <span className="text-[10px] text-stone-600 font-bold uppercase">
                      未达成
                    </span>
                  )}
                </div>
                <div className="flex gap-3">
                  {item.rewards.map((r, idx) => (
                    <div
                      key={idx}
                      className="w-14 h-14 bg-stone-900/50 border border-stone-700 rounded flex items-center justify-center text-[10px] text-stone-500 text-center p-1"
                    >
                      {r.name}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function InventoryDrawer({
  isOpen,
  onClose,
  inventory,
  onPlace,
}: InventoryDrawerProps) {
  const [filter, setFilter] = useState<string>('全部');
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredList = inventory.filter((item) =>
    filter === '全部' ? true : item.type === filter
  );
  const sortedList = [...filteredList].sort((a, b) => a.id - b.id);

  return (
    <div
      className="fixed inset-0 z-[100] flex justify-end"
      onClick={() => {
        setActiveTooltip(null);
        onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/40"></div>
      <div
        className="relative w-80 bg-stone-900 border-l border-stone-700 shadow-2xl flex flex-col animate-in slide-in-from-right"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-stone-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-amber-500 tracking-widest">
              兵书库
            </h2>
            <button
              onClick={onClose}
              className="text-stone-500 hover:text-white text-2xl"
            >
              ×
            </button>
          </div>
          <div className="flex gap-1 overflow-x-auto pb-2">
            {['全部', '1格', '2格', '3格', '4格'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 text-xs rounded border transition-colors whitespace-nowrap ${
                  filter === f
                    ? 'bg-amber-900/40 border-amber-600 text-amber-400'
                    : 'bg-stone-800 border-stone-700 text-stone-500 hover:text-stone-300'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {sortedList.map((item) => (
            <div
              key={item.uid}
              className="bg-stone-800/50 border border-stone-700 p-4 rounded-lg flex flex-col items-center relative group"
            >
              <div className="absolute top-2 right-2 z-10">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTooltip(
                      activeTooltip === item.uid ? null : item.uid
                    );
                  }}
                  className="w-5 h-5 rounded-full border border-stone-500 text-stone-500 flex items-center justify-center text-[10px] hover:border-amber-500 hover:text-amber-500 transition-colors"
                >
                  ?
                </button>
                {activeTooltip === item.uid && (
                  <div className="absolute right-6 top-0 w-48 bg-stone-800 border border-amber-900/50 p-3 rounded-lg shadow-2xl z-20 animate-in fade-in zoom-in-95 duration-200">
                    <div className="text-[11px] text-amber-500/90 leading-relaxed italic">
                      {item.description}
                    </div>
                    <div className="absolute top-2 -right-1 w-2 h-2 bg-stone-800 border-r border-t border-amber-900/50 rotate-45"></div>
                  </div>
                )}
              </div>
              <div className="w-full flex justify-between items-center mb-3 pr-6">
                <div className="flex flex-col">
                  <span className="text-xs text-stone-500 font-mono">
                    ID: {item.id}
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-bold text-stone-200">
                      {item.name}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1 rounded bg-stone-900 border ${
                        item.quality === '优'
                          ? 'text-purple-400 border-purple-500/50'
                          : item.quality === '极'
                          ? 'text-orange-400 border-orange-500/50'
                          : 'text-green-400 border-green-500/50'
                      }`}
                    >
                      {item.quality || '良'}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 bg-stone-700 text-stone-400 rounded">
                  {item.type}
                </span>
              </div>
              <div className="flex flex-col gap-1 mb-4 bg-stone-900/50 p-2 rounded">
                {item.shape.map((row, rIdx) => (
                  <div key={rIdx} className="flex gap-1">
                    {row.map((cell, cIdx) => (
                      <div
                        key={cIdx}
                        className={`w-5 h-5 border ${
                          cell
                            ? `${item.color} border-stone-400/50 shadow-sm`
                            : 'border-transparent'
                        }`}
                      />
                    ))}
                  </div>
                ))}
              </div>
              <button
                onClick={() => onPlace(item)}
                className="w-full py-2 bg-stone-700 border border-stone-600 text-stone-300 text-sm rounded hover:bg-amber-900/40 hover:border-amber-600 transition-all font-bold"
              >
                摆 放
              </button>
            </div>
          ))}
          {sortedList.length === 0 && (
            <div className="text-center text-stone-600 mt-20 italic">
              库内暂无此类兵书
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 个人能力列表弹窗
function AbilitiesDrawer({
  isOpen,
  onClose,
  abilities,
  uses,
  onUse,
}: AbilitiesDrawerProps) {
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 z-[600] flex items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>
      <div
        className="relative w-[450px] bg-stone-900 border-2 border-indigo-500/30 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-stone-700 flex justify-between items-center bg-indigo-950/20">
          <h2 className="text-xl font-bold text-indigo-400 flex items-center gap-2">
            <span>📖</span> 个人能力
          </h2>
          <button
            onClick={onClose}
            className="text-stone-500 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>
        <div className="p-4 max-h-[500px] overflow-y-auto space-y-4">
          {abilities.length > 0 ? (
            abilities.map((ability) => {
              const remaining = uses[ability.id] || 0;
              return (
                <div
                  key={ability.id}
                  className="bg-stone-800/80 border border-stone-700 p-4 rounded-xl flex flex-col gap-3"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex gap-3">
                      <div className="w-12 h-12 bg-indigo-900/40 rounded-lg flex items-center justify-center border border-indigo-500/20 text-2xl">
                        ⚡
                      </div>
                      <div>
                        <div className="font-bold text-stone-200">
                          {ability.name}
                        </div>
                        <div className="text-xs text-stone-500 font-mono mt-1">
                          使用次数:{' '}
                          <span
                            className={
                              remaining > 0 ? 'text-green-500' : 'text-red-500'
                            }
                          >
                            {remaining}
                          </span>{' '}
                          / {ability.total}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-stone-400 leading-relaxed bg-black/20 p-2 rounded">
                    {ability.desc}
                  </div>
                  <button
                    disabled={remaining <= 0}
                    onClick={() => onUse(ability.id)}
                    className={`w-full py-2 rounded-lg font-bold transition-all ${
                      remaining > 0
                        ? 'bg-indigo-700 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-900/20'
                        : 'bg-stone-700 text-stone-500 cursor-not-allowed opacity-50'
                    }`}
                  >
                    {remaining > 0 ? '使 用' : '次数已耗尽'}
                  </button>
                </div>
              );
            })
          ) : (
            <div className="py-20 text-center flex flex-col items-center gap-4">
              <div className="text-4xl opacity-20">🔒</div>
              <div className="text-stone-500 text-sm italic">
                未解锁任何个人能力，请先在沙盘布置相关兵书
              </div>
            </div>
          )}
        </div>
        <div className="p-4 bg-stone-950/50 text-[10px] text-stone-600 text-center">
          能力由当前沙盘阵法决定，下阵相关兵书后能力将消失
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 3. 游戏主世界界面
// ==========================================
function MainGameInterface({
  onOpenSandTable,
}: {
  onOpenSandTable: () => void;
}) {
  return (
    <div className="min-h-screen bg-stone-950 flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]"></div>
      <div className="relative z-10 p-6 flex justify-between">
        <div className="flex gap-4">
          <div className="w-16 h-16 rounded-full bg-stone-800 border-2 border-stone-700 flex items-center justify-center text-stone-600">
            头像
          </div>
          <div className="flex gap-2 items-center">
            {['月', '节', '活', '招', '福'].map((i) => (
              <div
                key={i}
                className="w-10 h-10 rounded-full bg-stone-900 border border-stone-800 flex items-center justify-center text-stone-500 text-sm"
              >
                {i}
              </div>
            ))}
            <button
              onClick={onOpenSandTable}
              className="w-12 h-12 rounded-full bg-amber-900 border-2 border-amber-500 text-amber-500 flex items-center justify-center font-bold shadow-lg shadow-amber-900/20 hover:scale-110 transition-transform"
            >
              舆
            </button>
          </div>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center pointer-events-none">
        <span className="text-stone-800 text-6xl font-bold tracking-widest opacity-20">
          大地图场景预览
        </span>
      </div>
    </div>
  );
}

// ==========================================
// 4. 舆地兵书核心沙盘系统
// ==========================================
function SandTableSystem({ onClose }: { onClose: () => void }) {
  const [levelOpen, setLevelOpen] = useState(false);
  const [invOpen, setInvOpen] = useState(false);
  const [hoverPos, setHoverPos] = useState<HoverPos | null>(null);
  const [actionMenu, setActionMenu] = useState<ActionMenu | null>(null);

  // === 辅助函数：从本地读取存档 ===
  const getSavedData = <T,>(key: string, defaultValue: T): T => {
    try {
      const saved = localStorage.getItem(`HANNAN_SAVE_${key}`);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch (e) {
      return defaultValue;
    }
  };

  // === 1. 等级与经验 (带读档) ===
  const [exp] = useState(() => getSavedData('exp', 200));
  const expToNextLevel = 2000;
  const [currentLevel] = useState(() =>
    getSavedData('level', 2)
  );
  const [claimedLevels, setClaimedLevels] = useState(() =>
    getSavedData('claimed', [1])
  );
  const handleClaimReward = (lvl: number) => {
    if (lvl <= currentLevel && !claimedLevels.includes(lvl))
      setClaimedLevels([...claimedLevels, lvl]);
  };

  // === 2. 兵书库与沙盘 (带读档) ===
  const [inventory, setInventory] = useState<InventoryPiece[]>(() =>
    getSavedData('inventory', [
      { ...BINGSHU_TEMPLATES[0], uid: 'inv_1', quality: '良' },
      { ...BINGSHU_TEMPLATES[0], uid: 'inv_2', quality: '良' },
      { ...BINGSHU_TEMPLATES[1], uid: 'inv_3', quality: '良' },
      { ...BINGSHU_TEMPLATES[2], uid: 'inv_4', quality: '良' },
      { ...BINGSHU_TEMPLATES[3], uid: 'inv_5', quality: '良' },
    ])
  );
  const [placedPieces, setPlacedPieces] = useState<PlacedPiece[]>(() =>
    getSavedData('placedPieces', [])
  );
  const [selectedPiece, setSelectedPiece] = useState<InventoryPiece | null>(
    null
  );

  const [isExpanding, setIsExpanding] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [expansionInventory, setExpansionInventory] = useState<ExpansionPiece[]>(
    () =>
    getSavedData('expansionInventory', [
      {
        id: 'ext1',
        uid: 'e_1',
        name: '1格疆域',
        shape: [[1]],
        color: 'bg-stone-600',
      },
      {
        id: 'ext2',
        uid: 'e_2',
        name: '2格疆域',
        shape: [[1, 1]],
        color: 'bg-stone-600',
      },
      {
        id: 'ext3',
        uid: 'e_3',
        name: 'L型疆域',
        shape: [
          [1, 0],
          [1, 1],
        ],
        color: 'bg-stone-600',
      },
    ])
  );
  const [placedExpansions, setPlacedExpansions] = useState<PlacedExpansion[]>(
    () =>
    getSavedData('placedExpansions', [])
  );
  const [selectedExpansion, setSelectedExpansion] =
    useState<ExpansionPiece | null>(null);

  // === 3. 品质常量与合舆系统 ===
  const QUALITY_MAP: Record<
    string,
    { next: string | null; text: string; border: string }
  > = {
    良: { next: '优', text: 'text-green-400', border: 'border-green-500/50' },
    优: { next: '极', text: 'text-purple-400', border: 'border-purple-500/50' },
    极: { next: null, text: 'text-orange-400', border: 'border-orange-500/50' },
  };
  const [isMergeMode, setIsMergeMode] = useState(false);
  const [mergeTab, setMergeTab] = useState<MergeTab>('易形');
  const [mergePieces, setMergePieces] = useState<PlacedPiece[]>([]);
  const [upgradePieces, setUpgradePieces] = useState<InventoryPiece[]>([]);
  const [mergeSuccessData, setMergeSuccessData] = useState<
    (InventoryPiece & { isUpgrade: boolean }) | null
  >(null);

  // === 4. 堪舆系统 (残卷带读档) ===
  const [isKanyuMode, setIsKanyuMode] = useState(false);
  const [kanyuScraps, setKanyuScraps] = useState(() =>
    getSavedData('scraps', 100)
  );
  const kanyuCost = 5;
  const [kanyuResults, setKanyuResults] = useState<InventoryPiece[]>([]);
  const [isKanyuAnimating, setIsKanyuAnimating] = useState(false);

  const executeKanyu = () => {
    if (kanyuScraps < kanyuCost) {
      showToast('兵书残卷不足');
      return;
    }
    setIsKanyuAnimating(true);
    setKanyuResults([]);
    setTimeout(() => {
      const templates = BINGSHU_TEMPLATES.filter((t) => t.id < 3000);
      const results = Array.from({ length: 5 }, () => ({
        ...templates[Math.floor(Math.random() * templates.length)],
        quality: '良',
        uid: `kanyu_${Date.now()}_${Math.random()}`,
      }));
      setKanyuScraps((prev) => prev - kanyuCost);
      setKanyuResults(results);
      setIsKanyuAnimating(false);
    }, 800);
  };
  // === 5. 个人能力系统 ===
  const ABILITIES_CONFIG: AbilityConfig[] = [
    {
      id: 'dash',
      reqPieceId: 3001,
      name: '极速突进',
      desc: '在大地图上使部队行军速度临时提升50%，持续30分钟',
      total: 3,
    },
  ];
  const [abilityUses, setAbilityUses] = useState<Record<string, number>>({
    dash: 3,
  });
  const [abilitiesOpen, setAbilitiesOpen] = useState(false);
  const unlockedAbilities = ABILITIES_CONFIG.filter((ability) =>
    placedPieces.some((p) => p.id === ability.reqPieceId)
  );
  const handleUseAbility = (id: string) => {
    if (abilityUses[id] > 0)
      setAbilityUses((prev) => ({ ...prev, [id]: prev[id] - 1 }));
  };

  // === 6. 删略系统 ===
  const [isRecycleMode, setIsRecycleMode] = useState(false);
  const [recycleSelection, setRecycleSelection] = useState<string[]>([]);

  const getPieceScrapValue = (piece: InventoryPiece) =>
    piece.shape.flat().filter((x) => x).length;
  const totalRecycleValue = recycleSelection.reduce((total, uid) => {
    const piece = inventory.find((p) => p.uid === uid);
    return total + (piece ? getPieceScrapValue(piece) : 0);
  }, 0);
  const handleConfirmRecycle = () => {
    if (recycleSelection.length === 0) return;
    setKanyuScraps((prev) => prev + totalRecycleValue);
    setInventory((prev) =>
      prev.filter((p) => !recycleSelection.includes(p.uid))
    );
    setRecycleSelection([]);
    setIsRecycleMode(false);
  };

  // === 7. 阵眼与战法刻印系统 (带读档) ===
  const [isCoreUIOpen, setIsCoreUIOpen] = useState(false);
  const [coreStatus, setCoreStatus] = useState<CoreStatus>(() =>
    getSavedData('coreStatus', {
      wind: false,
      forest: false,
      mountain: false,
      fire: false,
    })
  );
  const [selectedQuadrant, setSelectedQuadrant] = useState<Quadrant | null>(
    null
  );
  const [equippedTactics, setEquippedTactics] = useState<EquippedTactics>(() =>
    getSavedData('equippedTactics', {
      wind: null,
      forest: null,
      mountain: null,
      fire: null,
    })
  );
  const [equippedSeals, setEquippedSeals] = useState<EquippedSeals>(() =>
    getSavedData('equippedSeals', {
      wind: [null, null, null],
      forest: [null, null, null],
      mountain: [null, null, null],
      fire: [null, null, null],
    })
  );

  const SEALS_CONFIG = [
    {
      id: 'po',
      name: '破',
      color: 'bg-red-600',
      style: 'rounded-none',
      effect: '战法威力提升 5%',
    },
    {
      id: 'lan',
      name: '澜',
      color: 'bg-blue-500',
      style: 'rounded-full',
      effect: '冷却时间缩短 5%',
    },
    {
      id: 'ze',
      name: '泽',
      color: 'bg-teal-500',
      style: 'rounded-md',
      effect: '战法范围扩大 10%',
    },
    {
      id: 'ting',
      name: '霆',
      color: 'bg-purple-500',
      style: 'rotate-45 scale-75',
      effect: '发动概率增加 3%',
    },
    {
      id: 'yan',
      name: '岩',
      color: 'bg-stone-500',
      style: 'rounded-sm border-2 border-stone-400',
      effect: '附带护盾效果',
    },
    {
      id: 'he',
      name: '合',
      color: 'bg-amber-500',
      style: 'rounded-full border-2 border-amber-300',
      effect: '全军士气+10',
    },
  ];

  const [sealCounts, setSealCounts] = useState<SealCounts>(() =>
    getSavedData('sealCounts', {
      po: 10,
      lan: 8,
      ze: 5,
      ting: 3,
      yan: 6,
      he: 2,
    })
  );
  const [isTacticsUIOpen, setIsTacticsUIOpen] = useState(false);
  const [activeTacticQuadrant, setActiveTacticQuadrant] =
    useState<Quadrant | null>(null);

  const [tempTacticIdx, setTempTacticIdx] = useState(0);
  const [tempSlots, setTempSlots] = useState<(Seal | null)[]>([
    null,
    null,
    null,
  ]);
  const [activeSlotIdx, setActiveSlotIdx] = useState<number | null>(null);

  const activeCoreCount = Object.values(coreStatus).filter(Boolean).length;

  const openTacticsUI = (quadrant: Quadrant) => {
    setActiveTacticQuadrant(quadrant);
    const currTactic = equippedTactics[quadrant];
    if (quadrant === 'wind') setTempTacticIdx(currTactic === 2 ? 1 : 0);
    else if (quadrant === 'forest') setTempTacticIdx(currTactic === 4 ? 1 : 0);
    else if (quadrant === 'mountain')
      setTempTacticIdx(currTactic === 6 ? 1 : 0);
    else if (quadrant === 'fire') setTempTacticIdx(currTactic === 8 ? 1 : 0);

    setTempSlots([...equippedSeals[quadrant]]);
    setActiveSlotIdx(null);
    setIsTacticsUIOpen(true);
  };

  const getAvailableSealCount = (sealId: string) => {
    if (!activeTacticQuadrant) return 0;
    let count = sealCounts[sealId];
    equippedSeals[activeTacticQuadrant].forEach((s) => {
      if (s && s.id === sealId) count += 1;
    });
    tempSlots.forEach((s) => {
      if (s && s.id === sealId) count -= 1;
    });
    return count;
  };

  // === 8. 刻印组与兑换系统 ===
  const [isSealSetOpen, setIsSealSetOpen] = useState(false);
  const [selectedExchangeSeal, setSelectedExchangeSeal] =
    useState<Seal | null>(null);
  const SEAL_EXCHANGE_COST = 20;

  const handleExchangeSeal = () => {
    if (!selectedExchangeSeal || kanyuScraps < SEAL_EXCHANGE_COST) {
      showToast('兵书残卷不足');
      return;
    }
    setKanyuScraps((prev) => prev - SEAL_EXCHANGE_COST);
    setSealCounts((prev) => ({
      ...prev,
      [selectedExchangeSeal.id]: prev[selectedExchangeSeal.id] + 1,
    }));
    showToast(`兑换成功：获得 [${selectedExchangeSeal.name}] 刻印`);
  };

  // === 9. 全局飘窗状态 ===
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  const handleToggleQuadrant = () => {
    if (selectedQuadrant) {
      if (!coreStatus[selectedQuadrant] && activeCoreCount >= 3) {
        showToast('激活的阵眼已满');
        return;
      }
      setCoreStatus((prev) => ({
        ...prev,
        [selectedQuadrant]: !prev[selectedQuadrant],
      }));
    }
  };

  // === 🚀 核心：自动保存逻辑 (监听所有状态并写入 LocalStorage) ===
  React.useEffect(() => {
    const saveData = {
      exp,
      level: currentLevel,
      claimed: claimedLevels,
      inventory,
      placedPieces,
      placedExpansions,
      expansionInventory,
      coreStatus,
      equippedTactics,
      equippedSeals,
      sealCounts,
      scraps: kanyuScraps,
    };
    Object.entries(saveData).forEach(([key, value]) => {
      localStorage.setItem(`HANNAN_SAVE_${key}`, JSON.stringify(value));
    });
  }, [
    exp,
    currentLevel,
    claimedLevels,
    inventory,
    placedPieces,
    placedExpansions,
    expansionInventory,
    coreStatus,
    equippedTactics,
    equippedSeals,
    sealCounts,
    kanyuScraps,
  ]);

  const GRID_SIZE = 5;
  const CENTER_COORD = 2;

  const toggleMergeMode = () => {
    if (isMergeMode) {
      setInventory((prev) => [...prev, ...mergePieces, ...upgradePieces]); // 增加退还 upgradePieces
      setMergePieces([]);
      setUpgradePieces([]);
      setIsMergeMode(false);
    } else {
      setSelectedPiece(null);
      setIsExpanding(false);
      setIsMergeMode(true);
      setMergeTab('易形');
    }
  };

  const calculateMergeResult = (): BingshuTemplate | null => {
    if (mergePieces.length < 2) return null;
    const grid = Array.from({ length: 2 }, () => Array(4).fill(0));
    mergePieces.forEach((p) => {
      for (let i = 0; i < p.shape.length; i++) {
        for (let j = 0; j < p.shape[i].length; j++) {
          if (p.shape[i][j] === 1) grid[p.startR + i][p.startC + j] = 1;
        }
      }
    });
    let minR = 2,
      maxR = -1,
      minC = 4,
      maxC = -1;
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 4; c++) {
        if (grid[r][c] === 1) {
          if (r < minR) minR = r;
          if (r > maxR) maxR = r;
          if (c < minC) minC = c;
          if (c > maxC) maxC = c;
        }
      }
    }
    if (maxR === -1) return null;
    const combinedShape = [];
    for (let r = minR; r <= maxR; r++) {
      const row = [];
      for (let c = minC; c <= maxC; c++) row.push(grid[r][c]);
      combinedShape.push(row);
    }
    const isMatrixEqual = (m1: number[][], m2: number[][]): boolean => {
      if (m1.length !== m2.length || m1[0].length !== m2[0].length)
        return false;
      for (let r = 0; r < m1.length; r++) {
        for (let c = 0; c < m1[0].length; c++) {
          if (m1[r][c] !== m2[r][c]) return false;
        }
      }
      return true;
    };
    const getRotations = (matrix: number[][]): number[][][] => {
      let current = matrix;
      const rotations = [current];
      for (let i = 0; i < 3; i++) {
        const rows = current.length;
        const cols = current[0].length;
        const next = Array.from({ length: cols }, () => Array(rows).fill(0));
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) next[c][rows - 1 - r] = current[r][c];
        }
        current = next;
        rotations.push(current);
      }
      return rotations;
    };
    for (const template of BINGSHU_TEMPLATES) {
      if (template.id === 1001 || template.id === 1002) continue;
      const rotations = getRotations(template.shape);
      for (const rotatedShape of rotations) {
        if (isMatrixEqual(combinedShape, rotatedShape)) return template;
      }
    }
    return null;
  };
  const mergeResult = calculateMergeResult();

  const handleExecuteMerge = () => {
    if (mergePieces.length < 2 || !mergeResult) return;
    const newPiece = {
      ...mergeResult,
      quality: '良',
      uid: `inv_merge_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    };
    setInventory((prev) => [...prev, newPiece]);
    setMergePieces([]);
    setMergeSuccessData({ ...newPiece, isUpgrade: false });
  };

  // 新增：升品执行逻辑 (3合1)
  const handleExecuteUpgrade = () => {
    if (upgradePieces.length !== 3) return;
    const basePiece = upgradePieces[0];
    const nextQuality = QUALITY_MAP[basePiece.quality]?.next;
    if (!nextQuality) return;

    const newPiece = {
      ...basePiece,
      quality: nextQuality,
      uid: `inv_upg_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    };
    setInventory((prev) => [...prev, newPiece]);
    setUpgradePieces([]);
    setMergeSuccessData({ ...newPiece, isUpgrade: true }); // 复用成功弹窗，打上升品标记
  };

  const getOccupyingMergePiece = (r: number, c: number) =>
    mergePieces.find((p) =>
      p.shape.some((row, i) =>
        row.some(
          (cell, j) => cell === 1 && p.startR + i === r && p.startC + j === c
        )
      )
    );
  const canPlaceInMerge = (
    piece: InventoryPiece | PlacedPiece | null,
    startR: number,
    startC: number,
    excludeUid: string | null = null
  ) => {
    if (!piece) return false;
    for (let i = 0; i < piece.shape.length; i++) {
      for (let j = 0; j < piece.shape[i].length; j++) {
        if (piece.shape[i][j] === 1) {
          const tR = startR + i;
          const tC = startC + j;
          if (tR < 0 || tR >= 2 || tC < 0 || tC >= 4) return false;
          const target = getOccupyingMergePiece(tR, tC);
          if (target && target.uid !== excludeUid) return false;
        }
      }
    }
    return true;
  };

  const isBaseUnlocked = (row: number, col: number) =>
    row >= 1 && row <= 3 && col >= 1 && col <= 3;
  const isCenterCore = (row: number, col: number) =>
    row === CENTER_COORD && col === CENTER_COORD;
  const getOccupyingExpansion = (r: number, c: number) =>
    placedExpansions.find((p) =>
      p.shape.some((row, i) =>
        row.some(
          (cell, j) => cell === 1 && p.startR + i === r && p.startC + j === c
        )
      )
    );
  const getOccupyingPiece = (r: number, c: number) =>
    placedPieces.find((p) =>
      p.shape.some((row, i) =>
        row.some(
          (cell, j) => cell === 1 && p.startR + i === r && p.startC + j === c
        )
      )
    );
  const isCellUnlocked = (row: number, col: number) =>
    isBaseUnlocked(row, col) || !!getOccupyingExpansion(row, col);

  const canPlaceExpansion = (
    piece: ExpansionPiece | PlacedExpansion | null,
    startR: number,
    startC: number,
    excludeUid: string | null = null
  ) => {
    if (!piece) return false;
    for (let i = 0; i < piece.shape.length; i++) {
      for (let j = 0; j < piece.shape[i].length; j++) {
        if (piece.shape[i][j] === 1) {
          const tR = startR + i;
          const tC = startC + j;
          if (tR < 0 || tR >= GRID_SIZE || tC < 0 || tC >= GRID_SIZE)
            return false;
          if (isBaseUnlocked(tR, tC)) return false;
          const extTarget = getOccupyingExpansion(tR, tC);
          if (extTarget && extTarget.uid !== excludeUid) return false;
        }
      }
    }
    return true;
  };

  const canPlacePiece = (
    piece: InventoryPiece | PlacedPiece | null,
    startR: number,
    startC: number,
    excludeUid: string | null = null
  ) => {
    if (!piece) return false;
    for (let i = 0; i < piece.shape.length; i++) {
      for (let j = 0; j < piece.shape[i].length; j++) {
        if (piece.shape[i][j] === 1) {
          const tR = startR + i;
          const tC = startC + j;
          if (!isCellUnlocked(tR, tC) || isCenterCore(tR, tC)) return false;
          const target = getOccupyingPiece(tR, tC);
          if (target && target.uid !== excludeUid) return false;
        }
      }
    }
    return true;
  };

  const rotatePiece = () => {
    if (isExpanding) {
      if (!selectedExpansion) return;
      const matrix = selectedExpansion.shape;
      const rows = matrix.length;
      const cols = matrix[0].length;
      const newMatrix = Array.from({ length: cols }, () =>
        Array(rows).fill(0)
      );
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) newMatrix[c][rows - 1 - r] = matrix[r][c];
      }
      setSelectedExpansion({ ...selectedExpansion, shape: newMatrix });
      return;
    }

    if (!selectedPiece) return;
    const matrix = selectedPiece.shape;
    const rows = matrix.length;
    const cols = matrix[0].length;
    const newMatrix = Array.from({ length: cols }, () => Array(rows).fill(0));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) newMatrix[c][rows - 1 - r] = matrix[r][c];
    }
    setSelectedPiece({ ...selectedPiece, shape: newMatrix });
  };

  const validateBingshuAfterExpRemove = (
    newPlacedExpansions: PlacedExpansion[]
  ) => {
    const validPieces: PlacedPiece[] = [];
    const invalidPieces: PlacedPiece[] = [];
    const tempIsCellUnlocked = (row: number, col: number) =>
      isBaseUnlocked(row, col) ||
      !!newPlacedExpansions.find((p) =>
        p.shape.some((rRow, i) =>
          rRow.some(
            (cell, j) =>
              cell === 1 && p.startR + i === row && p.startC + j === col
          )
        )
      );
    placedPieces.forEach((piece) => {
      let isValid = true;
      for (let i = 0; i < piece.shape.length; i++) {
        for (let j = 0; j < piece.shape[i].length; j++) {
          if (
            piece.shape[i][j] === 1 &&
            !tempIsCellUnlocked(piece.startR + i, piece.startC + j)
          )
            isValid = false;
        }
      }
      if (isValid) validPieces.push(piece);
      else invalidPieces.push(piece);
    });
    setPlacedPieces(validPieces);
    setInventory((prev) => [...prev, ...invalidPieces]);
  };

  const handleResetConfirm = () => {
    setInventory((prev) => [...prev, ...placedPieces]);
    setPlacedPieces([]);
    setExpansionInventory((prev) => [...prev, ...placedExpansions]);
    setPlacedExpansions([]);
    setResetModalOpen(false);
    setIsExpanding(false);
  };

  return (
    <div
      className="min-h-screen text-stone-200 p-8 font-serif relative flex flex-col items-center overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${uiWoodBg})` }}
      onClick={() => setActionMenu(null)}
    >
      <div className="w-full flex justify-between items-start z-10">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-stone-900 border border-stone-800 rounded text-stone-500 hover:text-stone-300"
        >
          ← 返回大地图
        </button>
        <button
          onClick={() => setLevelOpen(true)}
          className="relative w-16 h-16 group flex items-center justify-center transition-transform hover:scale-105"
        >
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle
              cx="32"
              cy="32"
              r="28"
              className="stroke-stone-800 fill-none"
              strokeWidth="4"
            />
            <circle
              cx="32"
              cy="32"
              r="28"
              className="stroke-amber-600 fill-none transition-all duration-1000"
              strokeWidth="4"
              strokeDasharray={2 * Math.PI * 28}
              strokeDashoffset={2 * Math.PI * 28 * (1 - exp / expToNextLevel)}
              strokeLinecap="round"
            />
          </svg>
          <div className="relative z-10 w-12 h-12 rounded-full bg-stone-900 border border-amber-900/50 flex flex-col items-center justify-center shadow-inner cursor-pointer">
            <span className="text-[10px] leading-none text-amber-900 font-bold">
              LV
            </span>
            <span className="text-xl leading-none font-bold text-amber-600">
              {currentLevel}
            </span>
          </div>
          <div className="absolute inset-0 rounded-full bg-amber-500/5 blur-md animate-pulse"></div>
        </button>
      </div>

      {(selectedPiece || selectedExpansion) && (
        <div className="absolute left-10 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              rotatePiece();
            }}
            className="w-16 h-16 rounded-full bg-stone-800 border-2 border-amber-600 flex flex-col items-center justify-center hover:bg-amber-900/40 shadow-xl"
          >
            <span className="text-2xl">🔄</span>
            <span className="text-[10px] text-amber-500">旋转</span>
          </button>
        </div>
      )}

      {!isKanyuMode && !isMergeMode && (
        <div
          className="absolute bottom-8 left-8 z-40 flex flex-col items-center gap-2 group cursor-pointer"
          onClick={() => setAbilitiesOpen(true)}
        >
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-900 to-blue-900 border-2 border-indigo-400 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.4)] transition-all group-hover:scale-110 group-active:scale-95">
            <span className="text-3xl">📖</span>
          </div>
          <span className="text-sm font-bold text-indigo-300 tracking-wider bg-black/40 px-3 py-0.5 rounded-full">
            个人能力
          </span>
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center -mt-10 w-full relative">
        <h1 className="text-4xl font-bold mb-8 text-amber-600 tracking-[0.8em]">
          {isMergeMode ? '兵书合舆' : '輿地兵书'}
        </h1>

        {!isMergeMode ? (
          <>
            <div className="flex gap-4 mb-8">
              <button
                onClick={() => {
                  setIsExpanding(!isExpanding);
                  setSelectedPiece(null);
                  setSelectedExpansion(null);
                }}
                className={`px-6 py-2 rounded-full font-bold transition-all border-2 ${
                  isExpanding
                    ? 'bg-amber-600 text-stone-900 border-amber-400 shadow-[0_0_15px_rgba(217,119,6,0.5)]'
                    : 'bg-stone-800 text-amber-600 border-stone-600 hover:border-amber-700'
                }`}
              >
                {isExpanding ? '完 成' : '扩 地'}
              </button>
              <button
                onClick={() => setResetModalOpen(true)}
                className="px-6 py-2 rounded-full font-bold bg-stone-800 text-red-500 border-2 border-stone-600 hover:border-red-700 transition-all"
              >
                重 置
              </button>
            </div>

            <div className="relative p-6 bg-stone-900 rounded border-2 border-stone-800 shadow-2xl">
              <div
                className="grid gap-2"
                style={{
                  gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
                }}
              >
                {Array.from({ length: GRID_SIZE }).map((_, r) =>
                  Array.from({ length: GRID_SIZE }).map((_, c) => {
                    const baseUnlocked = isBaseUnlocked(r, c);
                    const expansion = getOccupyingExpansion(r, c);
                    const isCore = isCenterCore(r, c);
                    const piece = getOccupyingPiece(r, c);

                    let bgClass = '';
                    let borderClass = '';
                    if (isCore) {
                      bgClass = 'bg-amber-900/20';
                      borderClass = 'border-amber-600/40';
                    } else if (isExpanding) {
                      if (expansion) {
                        bgClass = 'bg-stone-700';
                        borderClass = 'border-amber-600 shadow-inner';
                      } else if (!baseUnlocked) {
                        bgClass = 'bg-black/60';
                        borderClass =
                          'border-stone-700 border-dashed hover:border-amber-500';
                      } else {
                        bgClass = 'bg-stone-800/40';
                        borderClass = 'border-stone-700/50';
                      }
                    } else {
                      if (baseUnlocked || expansion) {
                        bgClass = 'bg-stone-800/40';
                        borderClass = 'border-stone-700/50';
                      } else {
                        bgClass = 'bg-black/40';
                        borderClass = 'border-stone-900 opacity-20';
                      }
                    }
                    if (piece) {
                      bgClass = piece.color;
                      borderClass = 'border-stone-400 opacity-90';
                    }

                    let preview = null;
                    if (hoverPos) {
                      if (isExpanding && selectedExpansion) {
                        if (
                          selectedExpansion.shape.some((row, i) =>
                            row.some(
                              (cell, j) =>
                                cell === 1 &&
                                hoverPos.r + i === r &&
                                hoverPos.c + j === c
                            )
                          )
                        )
                          preview = canPlaceExpansion(
                            selectedExpansion,
                            hoverPos.r,
                            hoverPos.c
                          )
                            ? 'valid'
                            : 'invalid';
                      } else if (
                        !isExpanding &&
                        selectedPiece &&
                        piece === undefined
                      ) {
                        if (
                          selectedPiece.shape.some((row, i) =>
                            row.some(
                              (cell, j) =>
                                cell === 1 &&
                                hoverPos.r + i === r &&
                                hoverPos.c + j === c
                            )
                          )
                        )
                          preview = canPlacePiece(
                            selectedPiece,
                            hoverPos.r,
                            hoverPos.c
                          )
                            ? 'valid'
                            : 'invalid';
                      }
                    }

                    if (preview === 'valid') {
                      bgClass = 'bg-green-500/50';
                      borderClass = 'border-green-400';
                    }
                    if (preview === 'invalid') {
                      bgClass = 'bg-red-500/50';
                      borderClass = 'border-red-400';
                    }

                    return (
                      <div
                        key={`${r}-${c}`}
                        className={`w-20 h-20 flex items-center justify-center border transition-all relative ${bgClass} ${borderClass}`}
                        onClick={(e) => {
                          if (isExpanding) {
                            if (selectedExpansion) {
                              if (canPlaceExpansion(selectedExpansion, r, c)) {
                                setPlacedExpansions([
                                  ...placedExpansions,
                                  {
                                    ...selectedExpansion,
                                    startR: r,
                                    startC: c,
                                  },
                                ]);
                                setSelectedExpansion(null);
                              }
                            } else if (expansion && !isBaseUnlocked(r, c)) {
                              e.stopPropagation();
                              setActionMenu({
                                type: 'expansion',
                                uid: expansion.uid,
                                x: e.clientX,
                                y: e.clientY,
                              });
                            }
                          } else {
                            if (!isCellUnlocked(r, c)) return;
                            if (
                              selectedPiece &&
                              canPlacePiece(selectedPiece, r, c)
                            ) {
                              setPlacedPieces([
                                ...placedPieces,
                                { ...selectedPiece, startR: r, startC: c },
                              ]);
                              setSelectedPiece(null);
                            } else if (piece) {
                              e.stopPropagation();
                              setActionMenu({
                                type: 'bingshu',
                                uid: piece.uid,
                                x: e.clientX,
                                y: e.clientY,
                              });
                            }
                          }
                        }}
                        onMouseEnter={() => setHoverPos({ r, c })}
                        onMouseLeave={() => setHoverPos(null)}
                      >
                        {isCore && (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsCoreUIOpen(true);
                            }}
                            className="w-14 h-14 rounded-full overflow-hidden grid grid-cols-2 grid-rows-2 gap-[2px] bg-stone-900 border-2 border-amber-600/50 cursor-pointer hover:scale-110 transition-transform shadow-lg z-10"
                          >
                            {/* TL: 风 */}
                            <div
                              className={`${
                                coreStatus.wind
                                  ? 'bg-teal-400'
                                  : 'bg-stone-700/50'
                              } transition-colors`}
                            />
                            {/* TR: 林 */}
                            <div
                              className={`${
                                coreStatus.forest
                                  ? 'bg-green-500'
                                  : 'bg-stone-700/50'
                              } transition-colors`}
                            />
                            {/* BL: 山 */}
                            <div
                              className={`${
                                coreStatus.mountain
                                  ? 'bg-stone-400'
                                  : 'bg-stone-700/50'
                              } transition-colors`}
                            />
                            {/* BR: 火 */}
                            <div
                              className={`${
                                coreStatus.fire
                                  ? 'bg-red-500'
                                  : 'bg-stone-700/50'
                              } transition-colors`}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center animate-in zoom-in-95 duration-500 w-full">
            {/* 顶层页签 */}
            <div className="flex gap-16 mb-8 border-b border-stone-800 w-full justify-center pb-3">
              <button
                onClick={() => setMergeTab('易形')}
                className={`text-2xl font-bold tracking-widest transition-colors relative ${
                  mergeTab === '易形'
                    ? 'text-amber-500'
                    : 'text-stone-600 hover:text-stone-400'
                }`}
              >
                易 形
                {mergeTab === '易形' && (
                  <div className="absolute -bottom-[14px] left-0 w-full h-1 bg-amber-500 rounded-t-full"></div>
                )}
              </button>
              <button
                onClick={() => setMergeTab('升品')}
                className={`text-2xl font-bold tracking-widest transition-colors relative ${
                  mergeTab === '升品'
                    ? 'text-amber-500'
                    : 'text-stone-600 hover:text-stone-400'
                }`}
              >
                升 品
                {mergeTab === '升品' && (
                  <div className="absolute -bottom-[14px] left-0 w-full h-1 bg-amber-500 rounded-t-full"></div>
                )}
              </button>
            </div>

            {mergeTab === '易形' ? (
              <>
                {/* 原有 2x4 合舆盘 */}
                <div className="relative p-6 bg-stone-900 rounded border-2 border-stone-800 shadow-2xl mb-8">
                  <div
                    className="grid gap-2"
                    style={{ gridTemplateColumns: `repeat(4, minmax(0, 1fr))` }}
                  >
                    {Array.from({ length: 2 }).map((_, r) =>
                      Array.from({ length: 4 }).map((_, c) => {
                        const piece = getOccupyingMergePiece(r, c);
                        let preview = null;
                        if (hoverPos && selectedPiece && piece === undefined) {
                          if (
                            selectedPiece.shape.some((row, i) =>
                              row.some(
                                (cell, j) =>
                                  cell === 1 &&
                                  hoverPos.r + i === r &&
                                  hoverPos.c + j === c
                              )
                            )
                          )
                            preview = canPlaceInMerge(
                              selectedPiece,
                              hoverPos.r,
                              hoverPos.c
                            )
                              ? 'valid'
                              : 'invalid';
                        }
                        let bgClass = 'bg-stone-800/60';
                        let borderClass = 'border-stone-700/50';
                        if (piece) {
                          bgClass = piece.color;
                          borderClass = 'border-stone-400 opacity-90';
                        }
                        if (preview === 'valid') {
                          bgClass = 'bg-green-500/50';
                          borderClass = 'border-green-400';
                        }
                        if (preview === 'invalid') {
                          bgClass = 'bg-red-500/50';
                          borderClass = 'border-red-400';
                        }

                        return (
                          <div
                            key={`merge-${r}-${c}`}
                            className={`w-20 h-20 flex items-center justify-center border transition-all relative ${bgClass} ${borderClass}`}
                            onClick={(e) => {
                              if (
                                selectedPiece &&
                                canPlaceInMerge(selectedPiece, r, c)
                              ) {
                                setMergePieces([
                                  ...mergePieces,
                                  { ...selectedPiece, startR: r, startC: c },
                                ]);
                                setSelectedPiece(null);
                              } else if (piece) {
                                e.stopPropagation();
                                setActionMenu({
                                  type: 'merge',
                                  uid: piece.uid,
                                  x: e.clientX,
                                  y: e.clientY,
                                });
                              }
                            }}
                            onMouseEnter={() => setHoverPos({ r, c })}
                            onMouseLeave={() => setHoverPos(null)}
                          >
                            {/* 新增：易形盘中显示小角标 */}
                            {piece &&
                              piece.startR === r &&
                              piece.startC === c && (
                                <div
                                  className={`absolute top-1 right-1 z-20 text-[8px] font-bold px-1 rounded bg-stone-950 border ${
                                    QUALITY_MAP[piece.quality || '良'].text
                                  } ${
                                    QUALITY_MAP[piece.quality || '良'].border
                                  }`}
                                >
                                  {piece.quality || '良'}
                                </div>
                              )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-center bg-stone-900/80 p-6 rounded-lg border border-stone-700 w-full max-w-md">
                  <span className="text-stone-400 text-sm mb-4">易形预览</span>
                  <div className="h-20 flex items-center justify-center mb-6 w-full">
                    {mergePieces.length < 2 || !mergeResult ? (
                      <span className="text-stone-500 italic">
                        无法进行易形
                      </span>
                    ) : (
                      <div className="flex items-center gap-4 animate-in fade-in">
                        <div className="flex flex-col gap-1 bg-stone-800 p-2 rounded border border-amber-600/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                          {mergeResult.shape.map((row, rIdx) => (
                            <div key={rIdx} className="flex gap-1">
                              {row.map((cell, cIdx) => (
                                <div
                                  key={cIdx}
                                  className={`w-6 h-6 border ${
                                    cell
                                      ? `${mergeResult.color} border-stone-400`
                                      : 'border-transparent'
                                  }`}
                                />
                              ))}
                            </div>
                          ))}
                        </div>
                        <span className="text-amber-500 font-bold">
                          {mergeResult.name}{' '}
                          <span className="text-green-500 text-xs ml-1">
                            [良]
                          </span>
                        </span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleExecuteMerge}
                    disabled={mergePieces.length < 2 || !mergeResult}
                    className={`w-full py-3 rounded font-bold tracking-widest transition-all ${
                      mergePieces.length >= 2 && mergeResult
                        ? 'bg-amber-700 hover:bg-amber-600 text-white shadow-[0_0_20px_rgba(245,158,11,0.4)]'
                        : 'bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700'
                    }`}
                  >
                    确 认 易 形
                  </button>
                </div>
              </>
            ) : (
              // 新增：升品模式 UI
              <div className="flex flex-col items-center w-full max-w-lg mt-4 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex gap-6 mb-10 p-10 bg-stone-900 rounded-2xl border-2 border-stone-800 shadow-2xl">
                  {[0, 1, 2].map((slotIdx) => {
                    const piece = upgradePieces[slotIdx];
                    return (
                      <div
                        key={slotIdx}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (selectedPiece) {
                            if (selectedPiece.quality === '极') {
                              showToast('极品已达最高，无法继续升品');
                              return;
                            }
                            if (upgradePieces.length > 0) {
                              if (
                                selectedPiece.id !== upgradePieces[0].id ||
                                selectedPiece.quality !==
                                  upgradePieces[0].quality
                              ) {
                                showToast(
                                  '必须放入完全相同的兵书 (同形、同品)'
                                );
                                return;
                              }
                            }
                            setUpgradePieces([...upgradePieces, selectedPiece]);
                            setSelectedPiece(null);
                          } else if (piece) {
                            setUpgradePieces(
                              upgradePieces.filter((p) => p.uid !== piece.uid)
                            );
                            setInventory([...inventory, piece]);
                          }
                        }}
                        className={`w-28 h-28 rounded-lg border-2 flex flex-col items-center justify-center cursor-pointer transition-all relative overflow-hidden
                             ${
                               piece
                                 ? 'bg-stone-800 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                                 : selectedPiece
                                 ? 'bg-stone-800/80 border-stone-500 border-dashed hover:border-amber-400'
                                 : 'bg-black/50 border-stone-700'
                             }`}
                      >
                        {piece ? (
                          <div className="flex flex-col items-center scale-90">
                            <span
                              className={`absolute top-1 right-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-stone-950 border ${
                                QUALITY_MAP[piece.quality].text
                              } ${QUALITY_MAP[piece.quality].border}`}
                            >
                              {piece.quality}
                            </span>
                            <div className="flex flex-col gap-1 mt-2">
                              {piece.shape.map((row, rI) => (
                                <div key={rI} className="flex gap-1">
                                  {row.map((cell, cI) => (
                                    <div
                                      key={cI}
                                      className={`w-5 h-5 border ${
                                        cell
                                          ? `${piece.color} border-stone-300`
                                          : 'border-transparent'
                                      }`}
                                    />
                                  ))}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-stone-600 font-bold tracking-widest">
                            {selectedPiece ? '点击放入' : '放入兵书'}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={handleExecuteUpgrade}
                  disabled={upgradePieces.length < 3}
                  className={`w-full py-4 rounded-full text-lg font-bold tracking-widest transition-all ${
                    upgradePieces.length === 3
                      ? 'bg-amber-700 hover:bg-amber-600 text-white shadow-[0_0_30px_rgba(245,158,11,0.5)]'
                      : 'bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700'
                  }`}
                >
                  确 认 升 品
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="w-full h-32 flex flex-col items-center justify-end pb-8 relative">
        {selectedPiece || selectedExpansion ? (
          <div
            onClick={() => {
              if (selectedPiece) {
                setInventory([...inventory, selectedPiece]);
                setSelectedPiece(null);
              }
              if (selectedExpansion) {
                setExpansionInventory([
                  ...expansionInventory,
                  selectedExpansion,
                ]);
                setSelectedExpansion(null);
              }
            }}
            className="w-[500px] h-24 bg-red-900/20 border-t-4 border-red-600/50 rounded-t-[100px] flex items-center justify-center cursor-pointer hover:bg-red-900/40 transition-all group animate-in slide-in-from-bottom"
          >
            <div className="flex flex-col items-center">
              <span className="text-red-500 text-2xl group-hover:scale-125 transition-transform">
                ✖
              </span>
              <span className="text-red-500 font-bold tracking-[0.5em] mt-1">
                放弃放置
              </span>
            </div>
          </div>
        ) : isExpanding ? (
          <div className="flex gap-4 w-full max-w-3xl overflow-x-auto bg-stone-900/80 p-4 border border-stone-700 rounded-lg animate-in slide-in-from-bottom">
            <span className="text-stone-400 font-bold self-center mr-4">
              拓地存货:
            </span>
            {expansionInventory.map((ext) => (
              <div
                key={ext.uid}
                onClick={() => {
                  setExpansionInventory(
                    expansionInventory.filter((i) => i.uid !== ext.uid)
                  );
                  setSelectedExpansion(ext);
                }}
                className="bg-stone-800 border border-stone-600 p-2 rounded cursor-pointer hover:border-amber-500 min-w-[80px] flex flex-col items-center"
              >
                <span className="text-xs text-stone-300 mb-2">{ext.name}</span>
                <div className="flex flex-col gap-1">
                  {ext.shape.map((row, rI) => (
                    <div key={rI} className="flex gap-1">
                      {row.map((cell, cI) => (
                        <div
                          key={cI}
                          className={`w-4 h-4 border ${
                            cell
                              ? 'bg-stone-500 border-stone-400'
                              : 'border-transparent'
                          }`}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {expansionInventory.length === 0 && (
              <span className="text-stone-600 self-center italic">
                无可用扩展地块
              </span>
            )}
          </div>
        ) : (
          <div className="flex justify-around w-full max-w-2xl">
            <DiamondButton
              label="兵书库"
              onClick={() => setInvOpen(true)}
              isActive={false}
            />
            <DiamondButton
              label="合舆"
              onClick={toggleMergeMode}
              isActive={isMergeMode}
            />
            <DiamondButton
              label="堪舆"
              onClick={() => setIsKanyuMode(true)}
              isActive={isKanyuMode}
            />
            <DiamondButton
              label="删略"
              onClick={() => setIsRecycleMode(true)}
              isActive={isRecycleMode}
            />
          </div>
        )}
      </div>

      {actionMenu && (
        <div
          className="fixed z-[200] bg-stone-800 border border-stone-600 shadow-2xl rounded p-1 flex flex-col gap-1 min-w-[120px]"
          style={{ left: actionMenu.x, top: actionMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-4 py-2 text-xs text-amber-500 border-b border-stone-700 mb-1 font-bold text-center">
            {actionMenu.type === 'bingshu'
              ? placedPieces.find((p) => p.uid === actionMenu.uid)?.name
              : actionMenu.type === 'merge'
              ? mergePieces.find((p) => p.uid === actionMenu.uid)?.name
              : placedExpansions.find((p) => p.uid === actionMenu.uid)?.name}
          </div>
          <button
            className="px-4 py-2 text-sm text-stone-200 hover:bg-amber-900/50 hover:text-amber-400 text-left"
            onClick={() => {
              if (actionMenu.type === 'bingshu') {
                const target = placedPieces.find(
                  (p) => p.uid === actionMenu.uid
                );
                setPlacedPieces(
                  placedPieces.filter((p) => p.uid !== actionMenu.uid)
                );
                if (target) setSelectedPiece(target);
              } else if (actionMenu.type === 'merge') {
                const target = mergePieces.find(
                  (p) => p.uid === actionMenu.uid
                );
                setMergePieces(
                  mergePieces.filter((p) => p.uid !== actionMenu.uid)
                );
                if (target) setSelectedPiece(target);
              } else {
                const target = placedExpansions.find(
                  (p) => p.uid === actionMenu.uid
                );
                const newPlacedExt = placedExpansions.filter(
                  (p) => p.uid !== actionMenu.uid
                );
                setPlacedExpansions(newPlacedExt);
                if (target) setSelectedExpansion(target);
                validateBingshuAfterExpRemove(newPlacedExt);
              }
              setActionMenu(null);
            }}
          >
            提 起
          </button>
          <button
            className="px-4 py-2 text-sm text-red-400 hover:bg-red-900/30 text-left"
            onClick={() => {
              if (actionMenu.type === 'bingshu') {
                const target = placedPieces.find(
                  (p) => p.uid === actionMenu.uid
                );
                setPlacedPieces(
                  placedPieces.filter((p) => p.uid !== actionMenu.uid)
                );
                if (target) setInventory([...inventory, target]);
              } else if (actionMenu.type === 'merge') {
                const target = mergePieces.find(
                  (p) => p.uid === actionMenu.uid
                );
                setMergePieces(
                  mergePieces.filter((p) => p.uid !== actionMenu.uid)
                );
                if (target) setInventory([...inventory, target]);
              } else {
                const target = placedExpansions.find(
                  (p) => p.uid === actionMenu.uid
                );
                const newPlacedExt = placedExpansions.filter(
                  (p) => p.uid !== actionMenu.uid
                );
                setPlacedExpansions(newPlacedExt);
                if (target) setExpansionInventory([...expansionInventory, target]);
                validateBingshuAfterExpRemove(newPlacedExt);
              }
              setActionMenu(null);
            }}
          >
            放 弃
          </button>
        </div>
      )}

      {resetModalOpen && (
        <div className="fixed inset-0 z-[300] bg-black/70 flex items-center justify-center">
          <div className="bg-stone-900 border border-stone-700 p-6 rounded-lg max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-bold text-red-500 mb-4">重置舆地</h3>
            <p className="text-stone-300 mb-6 leading-relaxed">
              确认重置后将扩展的地块和兵书全部下阵。是否继续？
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setResetModalOpen(false)}
                className="px-4 py-2 bg-stone-800 text-stone-300 rounded hover:bg-stone-700"
              >
                取消
              </button>
              <button
                onClick={handleResetConfirm}
                className="px-4 py-2 bg-red-900 text-red-200 rounded hover:bg-red-800"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}

      {mergeSuccessData && (
        <div className="fixed inset-0 z-[400] bg-black/80 flex items-center justify-center animate-in fade-in duration-300">
          <div className="bg-stone-900 border-2 border-amber-600/50 p-8 rounded-xl max-w-sm w-full shadow-[0_0_50px_rgba(245,158,11,0.2)] flex flex-col items-center animate-in zoom-in-95">
            <h3 className="text-2xl font-bold text-amber-500 mb-6 tracking-widest">
              合舆成功
            </h3>
            <div className="flex flex-col gap-1 bg-stone-800 p-5 rounded-lg border border-stone-600 mb-6 shadow-inner relative overflow-hidden">
              <div className="absolute inset-0 bg-amber-500/10 animate-pulse"></div>
              {mergeSuccessData.shape.map((row, rIdx) => (
                <div key={rIdx} className="flex gap-1 relative z-10">
                  {row.map((cell, cIdx) => (
                    <div
                      key={cIdx}
                      className={`w-8 h-8 border ${
                        cell
                          ? `${mergeSuccessData.color} border-stone-300 shadow-md`
                          : 'border-transparent'
                      }`}
                    />
                  ))}
                </div>
              ))}
            </div>
            <div className="text-xl font-bold text-stone-200 mb-2">
              {mergeSuccessData.name}
            </div>
            <div className="text-sm text-amber-500/80 mb-8 text-center px-4 leading-relaxed bg-amber-900/20 py-2 rounded">
              {mergeSuccessData.description}
            </div>
            <button
              onClick={() => setMergeSuccessData(null)}
              className="w-full py-3 bg-amber-700 hover:bg-amber-600 text-white rounded font-bold tracking-widest transition-colors shadow-lg"
            >
              确 认
            </button>
          </div>
        </div>
      )}

      {isKanyuMode && (
        <div
          className="fixed inset-0 z-[500] bg-stone-950/95 flex items-center justify-center animate-in fade-in duration-500"
          onClick={() => setIsKanyuMode(false)}
        >
          <div
            className="w-full h-full flex flex-col items-center justify-center gap-6 py-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-4xl font-bold text-amber-600 tracking-[0.8em]">
              堪舆推演
            </h2>
            <div className="relative flex flex-col items-center">
              <button
                onClick={executeKanyu}
                disabled={isKanyuAnimating || kanyuResults.length > 0}
                className={`relative w-40 h-40 rounded-full border-4 flex flex-col items-center justify-center transition-all ${
                  isKanyuAnimating
                    ? 'border-amber-500/50 scale-95'
                    : 'border-amber-600 hover:scale-105 shadow-[0_0_30px_rgba(217,119,6,0.3)]'
                } ${kanyuResults.length > 0 ? 'opacity-30' : 'opacity-100'}`}
              >
                <span className="text-6xl font-bold text-amber-500">堪</span>
                {isKanyuAnimating && (
                  <div className="absolute inset-0 rounded-full animate-ping bg-amber-500/20"></div>
                )}
              </button>
              <div className="mt-4 text-stone-400 font-mono text-lg">
                兵书残卷:{' '}
                <span
                  className={
                    kanyuScraps < kanyuCost ? 'text-red-500' : 'text-amber-500'
                  }
                >
                  {kanyuScraps}
                </span>{' '}
                / {kanyuCost}
              </div>
            </div>
            <div className="min-h-[180px] flex items-center justify-center gap-4">
              {kanyuResults.map((res, idx) => (
                <div
                  key={res.uid}
                  className="flex flex-col items-center animate-in slide-in-from-bottom duration-500"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="bg-stone-900 border border-stone-700 p-4 rounded-lg shadow-xl mb-3">
                    <div className="flex flex-col gap-1">
                      {res.shape.map((row, rI) => (
                        <div key={rI} className="flex gap-1">
                          {row.map((cell, cI) => (
                            <div
                              key={cI}
                              className={`w-6 h-6 border ${
                                cell
                                  ? `${res.color} border-stone-400`
                                  : 'border-transparent'
                              }`}
                            />
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                  <span className="text-xs text-stone-400">{res.name}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-3 animate-in fade-in zoom-in">
              <button
                onClick={() => setIsKanyuMode(false)}
                className="px-10 py-3 bg-stone-800 border border-stone-600 text-stone-300 rounded-full font-bold hover:bg-stone-700"
              >
                关 闭
              </button>
              {kanyuResults.length > 0 && (
                <button
                  onClick={executeKanyu}
                  className="px-10 py-3 bg-amber-700 text-white rounded-full font-bold hover:bg-amber-600 shadow-lg shadow-amber-900/40"
                >
                  继续堪舆
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {/* 删略弹窗 */}
      {isRecycleMode && (
        <div
          className="fixed inset-0 z-[600] bg-black/80 flex items-center justify-center animate-in fade-in duration-300"
          onClick={() => setIsRecycleMode(false)}
        >
          <div
            className="bg-stone-900 border-2 border-stone-700 p-6 rounded-xl w-[600px] max-w-[90vw] shadow-2xl flex flex-col animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 标题与关闭按钮 */}
            <div className="flex justify-between items-center mb-6 border-b border-stone-700 pb-4">
              <h3 className="text-xl font-bold text-red-500 tracking-widest">
                删略兵书
              </h3>
              <button
                onClick={() => setIsRecycleMode(false)}
                className="text-stone-500 hover:text-white text-3xl font-bold leading-none"
              >
                ×
              </button>
            </div>

            {/* 兵书列表：汇总库存与已上阵兵书并排序 */}
            <div className="grid grid-cols-6 gap-3 max-h-[400px] overflow-y-auto p-2 pr-4 custom-scrollbar">
              {[...inventory, ...placedPieces]
                .sort((a, b) => a.id - b.id)
                .map((piece) => {
                  const isPlaced = placedPieces.some(
                    (p) => p.uid === piece.uid
                  );
                  const isSelected = recycleSelection.includes(piece.uid);

                  return (
                    <div
                      key={piece.uid}
                      onClick={(e) => {
                        if (isPlaced) {
                          // 提供视觉抖动提示已上阵
                          e.currentTarget.classList.add('animate-shake');
                          setTimeout(
                            () =>
                              e.currentTarget.classList.remove('animate-shake'),
                            300
                          );
                          return;
                        }
                        if (isSelected) {
                          setRecycleSelection((prev) =>
                            prev.filter((id) => id !== piece.uid)
                          );
                        } else {
                          setRecycleSelection((prev) => [...prev, piece.uid]);
                        }
                      }}
                      className={`relative aspect-square flex flex-col items-center justify-center p-2 rounded border cursor-pointer transition-all overflow-hidden
                        ${
                          isPlaced
                            ? 'bg-stone-800/30 border-stone-800 opacity-50 cursor-not-allowed'
                            : isSelected
                            ? 'bg-red-900/40 border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)] scale-95'
                            : 'bg-stone-800 border-stone-600 hover:border-amber-700'
                        }`}
                    >
                      {/* 缩小版图形预览 */}
                      <div className="flex flex-col gap-[2px] scale-75 origin-center">
                        {piece.shape.map((row, rI) => (
                          <div key={rI} className="flex gap-[2px]">
                            {row.map((cell, cI) => (
                              <div
                                key={cI}
                                className={`w-3 h-3 border ${
                                  cell
                                    ? `${piece.color} border-stone-400`
                                    : 'border-transparent'
                                }`}
                              />
                            ))}
                          </div>
                        ))}
                      </div>

                      {/* 状态蒙版与角标 */}
                      {isPlaced && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <span className="text-[10px] text-red-500 font-bold -rotate-12 border border-red-500/50 bg-stone-900/80 px-1 py-0.5 rounded">
                            已上阵
                          </span>
                        </div>
                      )}
                      {isSelected && (
                        <span className="absolute top-1 right-1 text-red-500 text-xs font-bold">
                          ✓
                        </span>
                      )}
                    </div>
                  );
                })}
              {inventory.length === 0 && placedPieces.length === 0 && (
                <div className="col-span-6 text-center text-stone-600 py-10 italic">
                  当前没有可删略的兵书
                </div>
              )}
            </div>

            {/* 底部结算区 */}
            <div className="mt-6 pt-4 border-t border-stone-700 flex justify-between items-center bg-stone-900">
              <div className="text-stone-300 font-mono text-sm">
                <span className="text-stone-500">转化为兵书残卷: </span>
                <span className="text-amber-500 font-bold text-2xl ml-2">
                  +{totalRecycleValue}
                </span>
              </div>
              <button
                onClick={handleConfirmRecycle}
                disabled={recycleSelection.length === 0}
                className={`px-8 py-3 rounded-lg font-bold tracking-widest transition-all ${
                  recycleSelection.length > 0
                    ? 'bg-red-800 hover:bg-red-700 text-white shadow-lg shadow-red-900/30'
                    : 'bg-stone-800 text-stone-600 cursor-not-allowed'
                }`}
              >
                确认删略
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 阵眼风林火山大界面 */}
      {isCoreUIOpen && (
        <div
          className="fixed inset-0 z-[700] bg-black/95 flex flex-col items-center justify-center animate-in fade-in duration-300"
          onClick={() => {
            setIsCoreUIOpen(false);
            setSelectedQuadrant(null);
          }}
        >
          <div
            className="relative flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-4xl font-bold text-amber-500 tracking-[0.5em] mb-12">
              阵眼枢纽
            </h2>

            {/* 核心四等分大圆盘 */}
            <div className="relative w-[400px] h-[400px] rounded-full border-8 border-stone-800 bg-stone-900 grid grid-cols-2 grid-rows-2 gap-2 p-2 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden">
              {/* 风 (TL) - 战法方块移至右下角靠近中心 */}
              <div
                onClick={() => setSelectedQuadrant('wind')}
                className={`relative flex items-center justify-center cursor-pointer transition-all duration-300 rounded-tl-full ${
                  coreStatus.wind
                    ? 'bg-teal-600 shadow-[inset_0_0_50px_rgba(20,184,166,0.6)]'
                    : 'bg-stone-800 hover:bg-stone-700'
                } ${
                  selectedQuadrant === 'wind'
                    ? 'ring-4 ring-white z-20 scale-105'
                    : ''
                }`}
              >
                <span
                  className={`text-6xl font-bold ${
                    coreStatus.wind ? 'text-teal-900' : 'text-stone-600'
                  }`}
                >
                  风
                </span>
                {coreStatus.wind && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      openTacticsUI('wind');
                    }}
                    className="absolute bottom-4 right-4 w-16 h-12 bg-stone-950 border-2 border-amber-600/50 rounded shadow-[0_0_10px_rgba(0,0,0,0.8)] flex flex-col items-center justify-center hover:border-amber-400 transition-colors z-30"
                  >
                    <span className="text-[11px] text-teal-500 font-bold">
                      {equippedTactics.wind
                        ? `战法${equippedTactics.wind}`
                        : '战法'}
                    </span>
                    <div className="flex gap-[2px] mt-1">
                      {equippedSeals.wind.map((s, i) => (
                        <div
                          key={i}
                          className={`w-1.5 h-1.5 rounded-full ${
                            s ? s.color : 'bg-stone-800'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {/* 林 (TR) - 战法方块移至左下角靠近中心 */}
              <div
                onClick={() => setSelectedQuadrant('forest')}
                className={`relative flex items-center justify-center cursor-pointer transition-all duration-300 rounded-tr-full ${
                  coreStatus.forest
                    ? 'bg-green-600 shadow-[inset_0_0_50px_rgba(22,163,74,0.6)]'
                    : 'bg-stone-800 hover:bg-stone-700'
                } ${
                  selectedQuadrant === 'forest'
                    ? 'ring-4 ring-white z-20 scale-105'
                    : ''
                }`}
              >
                <span
                  className={`text-6xl font-bold ${
                    coreStatus.forest ? 'text-green-900' : 'text-stone-600'
                  }`}
                >
                  林
                </span>
                {coreStatus.forest && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      openTacticsUI('forest');
                    }}
                    className="absolute bottom-4 left-4 w-16 h-12 bg-stone-950 border-2 border-amber-600/50 rounded shadow-[0_0_10px_rgba(0,0,0,0.8)] flex flex-col items-center justify-center hover:border-amber-400 transition-colors z-30"
                  >
                    <span className="text-[11px] text-green-500 font-bold">
                      {equippedTactics.forest
                        ? `战法${equippedTactics.forest}`
                        : '战法'}
                    </span>
                    <div className="flex gap-[2px] mt-1">
                      {equippedSeals.forest.map((s, i) => (
                        <div
                          key={i}
                          className={`w-1.5 h-1.5 rounded-full ${
                            s ? s.color : 'bg-stone-800'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {/* 山 (BL) - 战法方块移至右上角靠近中心 */}
              <div
                onClick={() => setSelectedQuadrant('mountain')}
                className={`relative flex items-center justify-center cursor-pointer transition-all duration-300 rounded-bl-full ${
                  coreStatus.mountain
                    ? 'bg-stone-400 shadow-[inset_0_0_50px_rgba(168,162,158,0.6)]'
                    : 'bg-stone-800 hover:bg-stone-700'
                } ${
                  selectedQuadrant === 'mountain'
                    ? 'ring-4 ring-white z-20 scale-105'
                    : ''
                }`}
              >
                <span
                  className={`text-6xl font-bold ${
                    coreStatus.mountain ? 'text-stone-800' : 'text-stone-600'
                  }`}
                >
                  山
                </span>
                {coreStatus.mountain && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      openTacticsUI('mountain');
                    }}
                    className="absolute top-4 right-4 w-16 h-12 bg-stone-950 border-2 border-amber-600/50 rounded shadow-[0_0_10px_rgba(0,0,0,0.8)] flex flex-col items-center justify-center hover:border-amber-400 transition-colors z-30"
                  >
                    <span className="text-[11px] text-stone-400 font-bold">
                      {equippedTactics.mountain
                        ? `战法${equippedTactics.mountain}`
                        : '战法'}
                    </span>
                    <div className="flex gap-[2px] mt-1">
                      {equippedSeals.mountain.map((s, i) => (
                        <div
                          key={i}
                          className={`w-1.5 h-1.5 rounded-full ${
                            s ? s.color : 'bg-stone-800'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {/* 火 (BR) - 战法方块移至左上角靠近中心 */}
              <div
                onClick={() => setSelectedQuadrant('fire')}
                className={`relative flex items-center justify-center cursor-pointer transition-all duration-300 rounded-br-full ${
                  coreStatus.fire
                    ? 'bg-red-700 shadow-[inset_0_0_50px_rgba(220,38,38,0.6)]'
                    : 'bg-stone-800 hover:bg-stone-700'
                } ${
                  selectedQuadrant === 'fire'
                    ? 'ring-4 ring-white z-20 scale-105'
                    : ''
                }`}
              >
                <span
                  className={`text-6xl font-bold ${
                    coreStatus.fire ? 'text-red-900' : 'text-stone-600'
                  }`}
                >
                  火
                </span>
                {coreStatus.fire && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      openTacticsUI('fire');
                    }}
                    className="absolute top-4 left-4 w-16 h-12 bg-stone-950 border-2 border-amber-600/50 rounded shadow-[0_0_10px_rgba(0,0,0,0.8)] flex flex-col items-center justify-center hover:border-amber-400 transition-colors z-30"
                  >
                    <span className="text-[11px] text-red-500 font-bold">
                      {equippedTactics.fire
                        ? `战法${equippedTactics.fire}`
                        : '战法'}
                    </span>
                    <div className="flex gap-[2px] mt-1">
                      {equippedSeals.fire.map((s, i) => (
                        <div
                          key={i}
                          className={`w-1.5 h-1.5 rounded-full ${
                            s ? s.color : 'bg-stone-800'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 动态按钮控制区 (支持激活/关闭切换) */}
            <div className="h-24 mt-12 flex items-center justify-center">
              {selectedQuadrant &&
                (coreStatus[selectedQuadrant] ? (
                  <button
                    onClick={handleToggleQuadrant}
                    className="px-12 py-4 bg-red-800 hover:bg-red-700 text-white text-xl font-bold rounded-full tracking-widest transition-all"
                  >
                    关闭阵眼
                  </button>
                ) : activeCoreCount >= 3 ? (
                  <button
                    disabled
                    className="px-12 py-4 bg-stone-800 border border-stone-700 text-stone-500 text-xl font-bold rounded-full tracking-widest cursor-not-allowed"
                  >
                    已达上限
                  </button>
                ) : (
                  <button
                    onClick={handleToggleQuadrant}
                    className="px-12 py-4 bg-amber-600 hover:bg-amber-500 text-white text-xl font-bold rounded-full tracking-widest transition-all"
                  >
                    激活阵眼
                  </button>
                ))}
            </div>

            {/* 新增：右下角刻印组入口 */}
            <div className="absolute bottom-10 right-10">
              <button
                onClick={() => setIsSealSetOpen(true)}
                className="group flex flex-col items-center gap-2"
              >
                <div className="w-16 h-16 bg-stone-800 border-2 border-amber-600 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <span className="text-3xl">💎</span>
                </div>
                <span className="text-xs font-bold text-amber-600 tracking-widest">
                  刻印组
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 战法编辑子界面 */}
      {isTacticsUIOpen && activeTacticQuadrant && (
        <div className="fixed inset-0 z-[800] bg-black/90 flex items-center justify-center animate-in fade-in duration-300" onClick={() => { setIsTacticsUIOpen(false); setActiveSlotIdx(null); }}>
          <div 
            className="border-2 border-stone-700 p-8 rounded-2xl w-[800px] min-h-[600px] flex flex-col relative shadow-2xl bg-cover bg-center bg-no-repeat" 
            style={{ backgroundImage: `url(${uiWoodBg})` }}
            onClick={e => { e.stopPropagation(); setActiveSlotIdx(null); }}
          >
            {/* 添加一层极淡的黑色遮罩，确保木纹不会影响前面的文字阅读 */}
            <div className="absolute inset-0 bg-black/40 rounded-2xl pointer-events-none"></div>
            
            {/* 将内部所有内容用 z-10 包裹，确保它们显示在背景和遮罩的上方 */}
            <div className="relative z-10 flex flex-col h-full w-full">
            <button
              onClick={() => setIsTacticsUIOpen(false)}
              className="absolute top-4 right-6 text-stone-500 hover:text-white text-4xl font-light"
            >
              ×
            </button>
            <h3 className="text-2xl font-bold text-amber-500 mb-8 border-b border-stone-800 pb-4 tracking-widest text-center">
              战法编辑
            </h3>

            <div className="flex flex-1 gap-10">
              {/* 左侧：两个战法垂直排列 */}
              <div className="flex flex-col gap-6 w-44">
                {[0, 1].map((idx) => {
                  const tacticId = {
                    wind: [1, 2],
                    forest: [3, 4],
                    mountain: [5, 6],
                    fire: [7, 8],
                  }[activeTacticQuadrant][idx];
                  const isSelected = tempTacticIdx === idx;
                  return (
                    <div
                      key={idx}
                      onClick={(e) => {
                        e.stopPropagation();
                        setTempTacticIdx(idx);
                        // 2. 修改点：点击左侧切换战法后，重置右侧所有未确认的临时操作
                        setTempSlots([...equippedSeals[activeTacticQuadrant]]);
                        setActiveSlotIdx(null);
                      }}
                      className={`flex-1 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all border-4 relative ${
                        isSelected
                          ? 'bg-amber-900/40 border-amber-500'
                          : 'bg-stone-800 border-stone-700 hover:border-stone-500'
                      }`}
                    >
                      <span className="text-4xl mb-2">📜</span>
                      <span
                        className={`font-bold ${
                          isSelected ? 'text-amber-400' : 'text-stone-400'
                        }`}
                      >
                        战法 {tacticId}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* 右侧：属性预览与刻印槽 */}
              <div className="flex-1 flex flex-col">
                <div className="flex-1 bg-stone-950/50 border border-amber-600/30 rounded-xl p-6 mb-6">
                  <h4 className="text-amber-500 text-sm font-bold mb-4 tracking-widest flex items-center gap-2">
                    <span>✨</span> 战法增益属性
                  </h4>
                  <ul className="space-y-3">
                    {tempSlots.map(
                      (seal, i) =>
                        seal && (
                          <li
                            key={i}
                            className="flex gap-3 items-center text-xs text-stone-300 animate-in slide-in-from-left"
                          >
                            <span
                              className={`w-3 h-3 ${seal.style} ${seal.color}`}
                            ></span>
                            <span className="font-bold text-stone-200">
                              [{seal.name}]
                            </span>{' '}
                            {seal.effect}
                          </li>
                        )
                    )}
                    {tempSlots.filter((s) => s).length === 3 && (
                      <li className="text-amber-400 font-bold mt-4 pt-4 border-t border-stone-800 italic">
                        🔥 满刻印共鸣：全属性额外提升 20%
                      </li>
                    )}
                    {tempSlots.filter((s) => s).length === 0 && (
                      <li className="text-stone-600 italic text-center mt-10">
                        暂无镶嵌刻印
                      </li>
                    )}
                  </ul>
                </div>

                <div className="flex justify-center gap-6 p-4 bg-stone-800/40 rounded-xl">
                  {tempSlots.map((seal, slotIndex) => (
                    <div key={slotIndex} className="relative">
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveSlotIdx(
                            activeSlotIdx === slotIndex ? null : slotIndex
                          );
                        }}
                        className={`w-28 h-12 rounded-[100%] border-2 flex items-center justify-center shadow-inner cursor-pointer transition-all ${
                          seal
                            ? 'border-amber-500 bg-stone-800'
                            : 'border-stone-700 bg-black'
                        }`}
                      >
                        {seal ? (
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-3 h-3 ${seal.style} ${seal.color}`}
                            ></div>
                            <span className="text-stone-200 text-xs font-bold">
                              {seal.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-stone-600 font-bold">
                            空槽位
                          </span>
                        )}
                      </div>

                      {activeSlotIdx === slotIndex && (
                        <div
                          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-[280px] bg-stone-800 border border-stone-600 p-3 rounded-xl shadow-2xl z-50 flex flex-wrap gap-2 animate-in zoom-in-95"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {SEALS_CONFIG.map((s) => {
                            const availableCount = getAvailableSealCount(s.id);
                            const isEquippedHere =
                              tempSlots[slotIndex]?.id === s.id;
                            const disabled =
                              availableCount <= 0 && !isEquippedHere;

                            return (
                              <div
                                key={s.id}
                                onClick={() => {
                                  if (disabled) return;
                                  const newSlots = [...tempSlots];
                                  if (isEquippedHere) {
                                    newSlots[slotIndex] = null; // 再次点击下阵
                                  } else {
                                    newSlots[slotIndex] = s;
                                  }
                                  setTempSlots(newSlots);
                                  setActiveSlotIdx(null);
                                }}
                                className={`flex flex-col items-center gap-1 p-2 rounded-lg relative w-[60px] transition-colors
                                   ${
                                     disabled
                                       ? 'opacity-30 cursor-not-allowed'
                                       : 'hover:bg-stone-700 cursor-pointer'
                                   }`}
                              >
                                <div
                                  className={`w-5 h-5 ${s.style} ${s.color}`}
                                ></div>
                                <span className="text-[10px] font-bold text-stone-300">
                                  {s.name}
                                </span>
                                {/* 1. 修改点：显示实时动态数量 */}
                                <span
                                  className={`absolute -top-1 -right-1 text-[8px] bg-stone-950 px-1 rounded ${
                                    availableCount > 0
                                      ? 'text-green-500'
                                      : 'text-stone-500'
                                  }`}
                                >
                                  x{availableCount}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();

                // 1. 确认时：扣除与返还全局库存
                setSealCounts((prev) => {
                  const next = { ...prev };
                  equippedSeals[activeTacticQuadrant].forEach((s) => {
                    if (s) next[s.id] += 1;
                  }); // 把旧的返回给仓库
                  tempSlots.forEach((s) => {
                    if (s) next[s.id] -= 1;
                  }); // 扣除新的所需数量
                  return next;
                });

                const tacticId = {
                  wind: [1, 2],
                  forest: [3, 4],
                  mountain: [5, 6],
                  fire: [7, 8],
                }[activeTacticQuadrant][tempTacticIdx];
                setEquippedTactics((prev) => ({
                  ...prev,
                  [activeTacticQuadrant]: tacticId,
                }));
                setEquippedSeals((prev) => ({
                  ...prev,
                  [activeTacticQuadrant]: tempSlots,
                }));
                setIsTacticsUIOpen(false);
                setActiveSlotIdx(null);
              }}
              className="mt-8 mx-auto px-20 py-3 bg-amber-700 hover:bg-amber-600 text-white font-bold rounded-full shadow-lg transition-all"
            >
              确认使用
            </button>
          </div>
        </div>
      </div>
      )}
      <InventoryDrawer
        isOpen={invOpen}
        onClose={() => setInvOpen(false)}
        inventory={inventory}
        onPlace={(item) => {
          setInventory(inventory.filter((i) => i.uid !== item.uid));
          setSelectedPiece(item);
          setInvOpen(false);
        }}
      />
      <LevelDrawer
        isOpen={levelOpen}
        onClose={() => setLevelOpen(false)}
        currentLevel={currentLevel}
        exp={exp}
        expToNextLevel={expToNextLevel}
        claimedLevels={claimedLevels}
        onClaim={handleClaimReward}
      />
      <AbilitiesDrawer
        isOpen={abilitiesOpen}
        onClose={() => setAbilitiesOpen(false)}
        abilities={unlockedAbilities}
        uses={abilityUses}
        onUse={handleUseAbility}
      />
      {/* 刻印组及兑换界面 */}
      {isSealSetOpen && (
        <div className="fixed inset-0 z-[900] bg-black/95 flex items-center justify-center animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-stone-900 border-2 border-stone-700 p-10 rounded-3xl w-[700px] flex flex-col relative shadow-[0_0_100px_rgba(0,0,0,1)]">
            <button
              onClick={() => {
                setIsSealSetOpen(false);
                setSelectedExchangeSeal(null);
              }}
              className="absolute top-6 right-8 text-stone-500 hover:text-white text-5xl font-light"
            >
              ×
            </button>

            <div className="flex justify-between items-end mb-10 border-b border-stone-800 pb-6">
              <h3 className="text-3xl font-bold text-amber-500 tracking-[0.3em]">
                刻印组谱
              </h3>
              <div className="text-stone-400 font-mono">
                当前持有兵书残卷:{' '}
                <span className="text-amber-500 text-xl font-bold">
                  {kanyuScraps}
                </span>
              </div>
            </div>

            {/* 刻印展示网格 */}
            <div className="grid grid-cols-3 gap-6 mb-12">
              {SEALS_CONFIG.map((s) => {
                const currentCount = sealCounts[s.id];
                const isSelected = selectedExchangeSeal?.id === s.id;
                return (
                  <div
                    key={s.id}
                    onClick={() => setSelectedExchangeSeal(s)}
                    className={`p-6 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center gap-4 relative
                      ${
                        isSelected
                          ? 'bg-amber-900/30 border-amber-500 scale-105 shadow-2xl'
                          : 'bg-stone-800/50 border-stone-700 hover:border-stone-500'
                      }`}
                  >
                    <div
                      className={`w-12 h-12 shadow-2xl ${s.style} ${s.color}`}
                    ></div>
                    <div className="text-center">
                      <div className="text-stone-200 font-bold text-lg">
                        [{s.name}] 刻印
                      </div>
                      <div className="text-xs text-stone-500 mt-1">
                        持有数量:{' '}
                        <span className="text-amber-600 font-bold">
                          {currentCount}
                        </span>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="absolute top-2 right-2 text-amber-500">
                        ●
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 兑换操作区 */}
            <div className="mt-auto bg-stone-950/50 border border-stone-800 p-8 rounded-2xl flex flex-col items-center min-h-[180px]">
              {selectedExchangeSeal ? (
                <div className="flex flex-col items-center animate-in slide-in-from-bottom-4">
                  <div className="text-stone-400 text-sm mb-2 italic">
                    "{selectedExchangeSeal.effect}"
                  </div>
                  <div className="flex items-center gap-2 mb-6">
                    <span className="text-stone-500 text-sm">消耗残卷:</span>
                    <span
                      className={`text-xl font-mono font-bold ${
                        kanyuScraps < SEAL_EXCHANGE_COST
                          ? 'text-red-500'
                          : 'text-amber-500'
                      }`}
                    >
                      {SEAL_EXCHANGE_COST}
                    </span>
                  </div>
                  <button
                    onClick={handleExchangeSeal}
                    className="px-20 py-4 bg-amber-700 hover:bg-amber-600 text-white text-xl font-bold rounded-full shadow-lg shadow-amber-900/40 tracking-widest transition-all active:scale-95"
                  >
                    兑 换
                  </button>
                </div>
              ) : (
                <div className="text-stone-600 italic mt-10">
                  请选择上方刻印进行兑换
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 全局飘窗提示 */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[1000] bg-red-900/90 border border-red-500 text-white px-6 py-2 rounded-full shadow-2xl animate-in fade-in slide-in-from-top duration-300 font-bold">
          {toast}
        </div>
      )}
    </div>
  );
}

// ==========================================
// 5. 状态路由控制器
// ==========================================
export default function App() {
  const buttonClickAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    buttonClickAudioRef.current = new Audio(
      new URL('./assets/ui-button.MP3', import.meta.url).href
    );
    buttonClickAudioRef.current.volume = 0.6;

    const playButtonSound = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest('button')) return;

      const audio = buttonClickAudioRef.current;
      if (!audio) return;
      audio.currentTime = 0;
      void audio.play().catch(() => {});
    };

    document.addEventListener('click', playButtonSound);
    return () => {
      document.removeEventListener('click', playButtonSound);
      buttonClickAudioRef.current = null;
    };
  }, []);

  const [currentView, setCurrentView] = useState('main');
  if (currentView === 'sandtable')
    return <SandTableSystem onClose={() => setCurrentView('main')} />;
  return (
    <MainGameInterface onOpenSandTable={() => setCurrentView('sandtable')} />
  );
}
