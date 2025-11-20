import React, { useMemo, useState } from 'react';

// ======================================================
// CONFIG: change these to tweak the whole app
// ======================================================

const CONFIG = {
  APP_TITLE: 'Options Machine: Learn Options with FuturePhone Co',
  BACKGROUND_COLOR: '#101418',
  PRIMARY_COLOR: '#00AEEF', // stock / main highlights
  SECONDARY_COLOR: '#F5A623', // option payoff
  PROFIT_COLOR: '#00C853',
  LOSS_COLOR: '#D50000',
  TEXT_FONT: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",

  // Scenario
  SCENARIO_STOCK_NAME: 'FuturePhone Co',
  SCENARIO_START_PRICE: 100,
  SCENARIO_STRIKE_ATM: 100,
  SCENARIO_STRIKE_OTM: 110,
  SCENARIO_STRIKE_ITM: 90,

  SCENARIO_EXPIRY_DAYS: 30,
  SCENARIO_VOLATILITY: 0.25, // 25%
  SCENARIO_RISK_FREE_RATE: 0.02,

  DEFAULT_OPTION_TYPE: 'call' as OptionType,
  DEFAULT_POSITION: 'long' as PositionType,
  DEFAULT_QUANTITY: 1,
  DEFAULT_PREMIUM: 5,
};

type OptionType = 'call' | 'put';
type PositionType = 'long' | 'short';

interface OptionInputs {
  optionType: OptionType;
  position: PositionType;
  S: number; // stock price now
  K: number; // strike
  T_days: number; // days to expiry
  sigma: number; // volatility
  premium: number; // option price
  quantity: number; // number of shares (simplified)
}

interface OptionOutputs {
  intrinsicValuePerShare: number;
  timeValuePerShare: number;
  totalOptionValuePerShare: number;
  payoffIfExpiredTodayTotal: number;
  profitLossIfExpiredTodayTotal: number;
}

// ======================================================
// Core option math (simple, teaching-friendly)
// ======================================================

function computeIntrinsicValue(optionType: OptionType, S: number, K: number): number {
  if (optionType === 'call') {
    return Math.max(S - K, 0);
  }
  return Math.max(K - S, 0);
}

function computePayoffAtExpiration(
  optionType: OptionType,
  position: PositionType,
  S_T: number,
  K: number,
  premium: number,
  quantity: number
): number {
  const intrinsic = computeIntrinsicValue(optionType, S_T, K);

  let perShare: number;
  if (position === 'long') {
    // long: pay premium, gain intrinsic
    perShare = intrinsic - premium;
  } else {
    // short: receive premium, owe intrinsic if in the money
    perShare = premium - intrinsic;
  }

  return perShare * quantity;
}

function updateMachineState(inputs: OptionInputs): OptionOutputs {
  const { optionType, position, S, K, T_days, sigma, premium, quantity } = inputs;

  const intrinsicPerShare = computeIntrinsicValue(optionType, S, K);

  const maxTimeValueAtStart = Math.max(premium - intrinsicPerShare, 0);

  const timeFactor =
    CONFIG.SCENARIO_EXPIRY_DAYS > 0
      ? Math.max(0, Math.min(T_days / CONFIG.SCENARIO_EXPIRY_DAYS, 1))
      : 0;

  const volFactor =
    CONFIG.SCENARIO_VOLATILITY > 0
      ? Math.max(0.1, 0.5 + sigma / (2 * CONFIG.SCENARIO_VOLATILITY))
      : 1;

  let timeValuePerShare = maxTimeValueAtStart * timeFactor * volFactor;
  timeValuePerShare = Math.max(timeValuePerShare, 0);
  timeValuePerShare = Math.min(timeValuePerShare, 3 * maxTimeValueAtStart + 1e-6);

  const totalOptionValuePerShare = intrinsicPerShare + timeValuePerShare;

  const payoffIfExpiredTodayTotal = computePayoffAtExpiration(
    optionType,
    position,
    S, // if expired right now at S
    K,
    premium,
    quantity
  );

  return {
    intrinsicValuePerShare: intrinsicPerShare,
    timeValuePerShare,
    totalOptionValuePerShare,
    payoffIfExpiredTodayTotal,
    profitLossIfExpiredTodayTotal: payoffIfExpiredTodayTotal,
  };
}

// ======================================================
// Reusable UI bits (characters, cards, layout)
// ======================================================

interface CharacterBubbleProps {
  name: 'Sky' | 'Nova';
  tone?: 'primary' | 'secondary';
  children: React.ReactNode;
}

const CharacterBubble: React.FC<CharacterBubbleProps> = ({ name, tone = 'primary', children }) => {
  const isNova = name === 'Nova';
  const borderColor = tone === 'primary' ? CONFIG.PRIMARY_COLOR : CONFIG.SECONDARY_COLOR;

  return (
    <div className="flex gap-3 items-start mb-3">
      <div className="flex flex-col items-center">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold"
          style={{
            border: `3px solid ${borderColor}`,
            background:
              name === 'Sky'
                ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                : 'linear-gradient(135deg, #f97316, #facc15)',
            color: '#0f172a',
          }}
        >
          {isNova ? '🤖' : '🧒'}
        </div>
        <span className="mt-1 text-xs text-slate-300 font-semibold">{name}</span>
      </div>
      <div className="rounded-2xl px-4 py-3 text-sm leading-relaxed bg-slate-800/80 border border-slate-700 max-w-xl">
        <span className="font-semibold mr-1">{name}:</span>
        <span>{children}</span>
      </div>
    </div>
  );
};

interface SectionCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

const SectionCard: React.FC<SectionCardProps> = ({ title, subtitle, children }) => {
  return (
    <div className="w-full max-w-5xl mx-auto bg-slate-900/80 border border-slate-700 rounded-3xl p-6 md:p-8 shadow-xl shadow-slate-950/40">
      <div className="flex flex-col md:flex-row md:items-baseline md:justify-between gap-2 mb-4">
        <h2 className="text-xl md:text-2xl font-bold tracking-tight" style={{ color: CONFIG.PRIMARY_COLOR }}>
          {title}
        </h2>
        {subtitle && <p className="text-xs md:text-sm text-slate-400 max-w-md">{subtitle}</p>}
      </div>
      <div>{children}</div>
    </div>
  );
};

const FuturePhoneCard: React.FC = () => {
  return (
    <div className="inline-flex items-center gap-3 rounded-2xl px-4 py-3 bg-slate-800/80 border border-slate-700 text-xs md:text-sm text-slate-100">
      <div className="flex flex-col">
        <span className="font-semibold text-slate-100">{CONFIG.SCENARIO_STOCK_NAME}</span>
        <span className="text-slate-300">
          Price now:{' '}
          <span style={{ color: CONFIG.PRIMARY_COLOR }}>${CONFIG.SCENARIO_START_PRICE.toFixed(0)}</span>
        </span>
        <span className="text-slate-300">
          Typical strike:{' '}
          <span style={{ color: CONFIG.SECONDARY_COLOR }}>${CONFIG.SCENARIO_STRIKE_ATM.toFixed(0)}</span>
        </span>
        <span className="text-slate-400">
          Expiry ~ {CONFIG.SCENARIO_EXPIRY_DAYS} days · Vol ≈ {(CONFIG.SCENARIO_VOLATILITY * 100).toFixed(0)}%
        </span>
      </div>
    </div>
  );
};

// ======================================================
// Options Machine (interactive core)
// ======================================================

const OptionsMachine: React.FC = () => {
  const [inputs, setInputs] = useState<OptionInputs>({
    optionType: CONFIG.DEFAULT_OPTION_TYPE,
    position: CONFIG.DEFAULT_POSITION,
    S: CONFIG.SCENARIO_START_PRICE,
    K: CONFIG.SCENARIO_STRIKE_ATM,
    T_days: CONFIG.SCENARIO_EXPIRY_DAYS,
    sigma: CONFIG.SCENARIO_VOLATILITY,
    premium: CONFIG.DEFAULT_PREMIUM,
    quantity: CONFIG.DEFAULT_QUANTITY,
  });

  const outputs = useMemo(() => updateMachineState(inputs), [inputs]);

  const payoffPoints = useMemo(() => {
    const xs: number[] = [];
    for (let x = 50; x <= 150; x += 5) xs.push(x);
    return xs.map((S_T) => ({
      S_T,
      payoffPerShare: computePayoffAtExpiration(
        inputs.optionType,
        inputs.position,
        S_T,
        inputs.K,
        inputs.premium,
        1 // per share for the graph
      ),
    }));
  }, [inputs]);

  const minY = Math.min(...payoffPoints.map((p) => p.payoffPerShare), -10);
  const maxY = Math.max(...payoffPoints.map((p) => p.payoffPerShare), 10);
  const width = 320;
  const height = 200;
  const padding = 24;

  const scaleX = (S_T: number) => {
    const minX = 50;
    const maxX = 150;
    return padding + ((S_T - minX) / (maxX - minX)) * (width - 2 * padding);
  };
  const scaleY = (y: number) => {
    if (maxY === minY) return height / 2;
    return height - (padding + ((y - minY) / (maxY - minY)) * (height - 2 * padding));
  };

  const payoffPolyline = payoffPoints
    .map((p) => `${scaleX(p.S_T)},${scaleY(p.payoffPerShare)}`)
    .join(' ');

  const currentPerShare = computePayoffAtExpiration(
    inputs.optionType,
    inputs.position,
    inputs.S,
    inputs.K,
    inputs.premium,
    1
  );
  const currentDotX = scaleX(inputs.S);
  const currentDotY = scaleY(currentPerShare);
  const zeroY = scaleY(0);

  const payoffColor = currentPerShare >= 0 ? CONFIG.PROFIT_COLOR : CONFIG.LOSS_COLOR;

  return (
    <div className="mt-4 grid grid-cols-1 lg:grid-cols-[1.1fr_1.3fr] gap-6">
      {/* Inputs */}
      <div className="bg-slate-900/80 border border-slate-700 rounded-2xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-slate-200 mb-1">Inputs</h3>

        {/* Stock & Strike */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="flex items-center justify-between text-xs text-slate-300">
              <span>Stock price S</span>
              <span className="font-mono text-slate-100">${inputs.S.toFixed(0)}</span>
            </label>
            <input
              type="range"
              min={50}
              max={150}
              value={inputs.S}
              onChange={(e) =>
                setInputs((prev) => ({
                  ...prev,
                  S: Number(e.target.value),
                }))
              }
              className="w-full accent-sky-400"
            />
          </div>
          <div>
            <label className="flex items-center justify-between text-xs text-slate-300">
              <span>Strike K</span>
              <span className="font-mono text-slate-100">${inputs.K.toFixed(0)}</span>
            </label>
            <input
              type="range"
              min={80}
              max={120}
              value={inputs.K}
              onChange={(e) =>
                setInputs((prev) => ({
                  ...prev,
                  K: Number(e.target.value),
                }))
              }
              className="w-full accent-amber-400"
            />
          </div>
        </div>

        {/* Time & Vol */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="flex items-center justify-between text-xs text-slate-300">
              <span>Days to expiry T</span>
              <span className="font-mono text-slate-100">{inputs.T_days.toFixed(0)} d</span>
            </label>
            <input
              type="range"
              min={0}
              max={60}
              value={inputs.T_days}
              onChange={(e) =>
                setInputs((prev) => ({
                  ...prev,
                  T_days: Number(e.target.value),
                }))
              }
              className="w-full accent-emerald-400"
            />
          </div>
          <div>
            <label className="flex items-center justify-between text-xs text-slate-300">
              <span>Volatility σ</span>
              <span className="font-mono text-slate-100">{(inputs.sigma * 100).toFixed(0)}%</span>
            </label>
            <input
              type="range"
              min={0.1}
              max={0.6}
              step={0.05}
              value={inputs.sigma}
              onChange={(e) =>
                setInputs((prev) => ({
                  ...prev,
                  sigma: Number(e.target.value),
                }))
              }
              className="w-full accent-purple-400"
            />
          </div>
        </div>

        {/* Premium & Quantity */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="flex items-center justify-between text-xs text-slate-300">
              <span>Premium (price)</span>
              <span className="font-mono text-slate-100">${inputs.premium.toFixed(2)}</span>
            </label>
            <input
              type="range"
              min={1}
              max={15}
              step={0.5}
              value={inputs.premium}
              onChange={(e) =>
                setInputs((prev) => ({
                  ...prev,
                  premium: Number(e.target.value),
                }))
              }
              className="w-full accent-pink-400"
            />
          </div>
          <div>
            <label className="flex items-center justify-between text-xs text-slate-300">
              <span>Quantity</span>
              <span className="font-mono text-slate-100">{inputs.quantity}</span>
            </label>
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={inputs.quantity}
              onChange={(e) =>
                setInputs((prev) => ({
                  ...prev,
                  quantity: Number(e.target.value),
                }))
              }
              className="w-full accent-lime-400"
            />
          </div>
        </div>

        {/* Type & Position */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-slate-300 mb-1">Option type</span>
            <div className="inline-flex rounded-full bg-slate-800 border border-slate-700 p-1">
              <button
                className={`flex-1 text-xs py-1 rounded-full ${
                  inputs.optionType === 'call'
                    ? 'bg-emerald-400 text-slate-900 font-semibold'
                    : 'text-slate-300'
                }`}
                onClick={() => setInputs((prev) => ({ ...prev, optionType: 'call' }))}
              >
                Call
              </button>
              <button
                className={`flex-1 text-xs py-1 rounded-full ${
                  inputs.optionType === 'put'
                    ? 'bg-rose-400 text-slate-900 font-semibold'
                    : 'text-slate-300'
                }`}
                onClick={() => setInputs((prev) => ({ ...prev, optionType: 'put' }))}
              >
                Put
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-slate-300 mb-1">Position</span>
            <div className="inline-flex rounded-full bg-slate-800 border border-slate-700 p-1">
              <button
                className={`flex-1 text-xs py-1 rounded-full ${
                  inputs.position === 'long'
                    ? 'bg-sky-400 text-slate-900 font-semibold'
                    : 'text-slate-300'
                }`}
                onClick={() => setInputs((prev) => ({ ...prev, position: 'long' }))}
              >
                Long (buy)
              </button>
              <button
                className={`flex-1 text-xs py-1 rounded-full ${
                  inputs.position === 'short'
                    ? 'bg-amber-400 text-slate-900 font-semibold'
                    : 'text-slate-300'
                }`}
                onClick={() => setInputs((prev) => ({ ...prev, position: 'short' }))}
              >
                Short (sell)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Outputs & graph */}
      <div className="bg-slate-900/80 border border-slate-700 rounded-2xl p-4 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="space-y-1">
            <div className="text-slate-300">Intrinsic value now</div>
            <div className="font-mono text-sm text-slate-100">
              ${outputs.intrinsicValuePerShare.toFixed(2)} / share
            </div>
            <div className="text-slate-400">How much the option is “in the money” right now.</div>
          </div>
          <div className="space-y-1">
            <div className="text-slate-300">Time value now</div>
            <div className="font-mono text-sm text-slate-100">
              ${outputs.timeValuePerShare.toFixed(2)} / share
            </div>
            <div className="text-slate-400">Extra value from “maybe” future moves.</div>
          </div>
          <div className="space-y-1">
            <div className="text-slate-300">Total option value now</div>
            <div className="font-mono text-sm text-slate-100">
              ${outputs.totalOptionValuePerShare.toFixed(2)} / share
            </div>
            <div className="text-slate-400">Intrinsic + time value (teaching approximation).</div>
          </div>
          <div className="space-y-1">
            <div className="text-slate-300">If it expired today at S = ${inputs.S.toFixed(0)}</div>
            <div
              className="font-mono text-sm"
              style={{ color: outputs.profitLossIfExpiredTodayTotal >= 0 ? CONFIG.PROFIT_COLOR : CONFIG.LOSS_COLOR }}
            >
              {outputs.profitLossIfExpiredTodayTotal >= 0 ? '+' : '-'}$
              {Math.abs(outputs.profitLossIfExpiredTodayTotal).toFixed(2)} total (for {inputs.quantity} share
              {inputs.quantity !== 1 ? 's' : ''})
            </div>
            <div className="text-slate-400">This is your profit or loss for this position if time ran out right now.</div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-start gap-4">
          <div className="flex-1">
            <div className="text-xs text-slate-300 mb-1">Payoff at expiration (per share)</div>
            <svg width={width} height={height} className="rounded-xl bg-slate-950/60 border border-slate-800">
              {/* axes */}
              <line x1={padding} x2={width - padding} y1={zeroY} y2={zeroY} stroke="#64748b" strokeDasharray="4 4" strokeWidth={1} />
              <line x1={padding} x2={width - padding} y1={height - padding} y2={height - padding} stroke="#475569" strokeWidth={1} />
              {/* payoff line */}
              <polyline points={payoffPolyline} fill="none" stroke={CONFIG.SECONDARY_COLOR} strokeWidth={2.5} />
              {/* current S marker */}
              <circle cx={currentDotX} cy={currentDotY} r={5} fill={payoffColor} stroke="#020617" strokeWidth={1} />
              <text x={currentDotX + 6} y={currentDotY - 6} fill={payoffColor} fontSize={10}>
                S = ${inputs.S.toFixed(0)}
              </text>
            </svg>
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>Stock price at expiration (S_T)</span>
              <span>Profit ↑ · Loss ↓</span>
            </div>
          </div>
          <div className="w-full md:w-40 text-[11px] text-slate-300 space-y-1">
            <div>• Green area on the graph = profit per share if the line is above zero.</div>
            <div>• Red area = loss per share if the line is below zero (we’re showing shape, not shading here).</div>
            <div>• Slide S, K, T, and σ and watch the point and curve change. This is your mental “options machine”.</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ======================================================
// Lesson sections (step-by-step for a 15-year-old)
// ======================================================

const IntroLesson: React.FC = () => {
  return (
    <SectionCard title="Welcome! Meet Sky, Nova, and FuturePhone Co" subtitle="A friendly story to see why options even exist.">
      <FuturePhoneCard />
      <div className="mt-4 space-y-2">
        <CharacterBubble name="Sky">
          I’m 15, I like tech, and I’m super curious about how people actually use the stock market to make money. I keep
          hearing “options” and “calls” and “puts”… but it all sounds like wizard language.
        </CharacterBubble>
        <CharacterBubble name="Nova" tone="secondary">
          Great news, Sky. I’m Nova, your cartoon options robot. We’ll use one stock — <strong>{CONFIG.SCENARIO_STOCK_NAME}</strong> —
          whose price is<span style={{ color: CONFIG.PRIMARY_COLOR }}> ${CONFIG.SCENARIO_START_PRICE.toFixed(0)}</span> right now. We’ll
          build a simple “options machine” you can play with until it feels obvious.
        </CharacterBubble>
        <CharacterBubble name="Nova">
          We’ll keep everything in plain English, use the same numbers over and over, and draw little pictures so you can
          literally see what’s going on.
        </CharacterBubble>
      </div>
    </SectionCard>
  );
};

const StockBasicsLesson: React.FC = () => {
  return (
    <SectionCard title="Step 1: What Is a Stock?" subtitle="Before options, we need to know what we’re betting on.">
      <FuturePhoneCard />
      <div className="mt-4 space-y-2">
        <CharacterBubble name="Nova">
          First, a stock is just a tiny slice of a company. If you own one share of <strong>{CONFIG.SCENARIO_STOCK_NAME}</strong>, you
          own a tiny bit of that company.
        </CharacterBubble>
        <CharacterBubble name="Sky">
          So if the company does well and people want the stock more, the price goes up. If it does badly, the price goes down?
        </CharacterBubble>
        <CharacterBubble name="Nova">
          Exactly. Right now the stock is at <span style={{ color: CONFIG.PRIMARY_COLOR }}>${CONFIG.SCENARIO_START_PRICE.toFixed(0)}</span>.
          But in the future, it might be 60 dollars, 100 dollars, or 140 dollars. We don’t know. That “don’t know” part is called
          uncertainty.
        </CharacterBubble>
        <CharacterBubble name="Nova">Options are special deals that let you make plans around that uncertainty without always buying the stock right now.</CharacterBubble>
      </div>
    </SectionCard>
  );
};

const WhyOptionsLesson: React.FC = () => {
  return (
    <SectionCard title="Step 2: Why Do Options Exist?" subtitle="Locking in choices about the future, with limited money now.">
      <FuturePhoneCard />
      <div className="mt-4 space-y-2">
        <CharacterBubble name="Sky">
          Suppose I think {CONFIG.SCENARIO_STOCK_NAME} might go up a lot, but I don’t have 100 dollars to buy a share today. I still want
          a way to benefit if it goes up. What can I do?
        </CharacterBubble>
        <CharacterBubble name="Nova" tone="secondary">
          That’s exactly where options come in. An option is a <strong>deal</strong> about the future. You pay a smaller amount today,
          called the <strong>premium</strong>, to lock in a choice later.
        </CharacterBubble>
        <CharacterBubble name="Nova">
          There are two main flavors we’ll use:
          <ul className="list-disc list-inside mt-1">
            <li>
              <strong>Call option</strong> – a deal that lets you buy the stock later at a price we choose now.
            </li>
            <li>
              <strong>Put option</strong> – a deal that lets you sell the stock later at a price we choose now.
            </li>
          </ul>
        </CharacterBubble>
      </div>
    </SectionCard>
  );
};

const CallLesson: React.FC = () => {
  const K = CONFIG.SCENARIO_STRIKE_ATM;
  const premium = 5;
  return (
    <SectionCard title="Step 3: Call Options in Plain English" subtitle="A call = a deal that lets you buy later at a fixed price.">
      <FuturePhoneCard />
      <div className="mt-4 space-y-2">
        <CharacterBubble name="Nova">
          Let’s make a call option on {CONFIG.SCENARIO_STOCK_NAME}.
          <br />
          We say:
          <ul className="list-disc list-inside mt-1">
            <li>Strike price K = ${K}</li>
            <li>Premium = ${premium}</li>
            <li>Time until expiration ≈ {CONFIG.SCENARIO_EXPIRY_DAYS} days</li>
          </ul>
          You pay 5 dollars now. In return, you get the <strong>right</strong> (not the obligation) to buy the stock at 100 any time before
          the deadline.
        </CharacterBubble>
        <CharacterBubble name="Sky">
          So if the stock goes up, my deal looks good. If it goes down, I can just ignore the option and only lose the 5 dollars I paid?
        </CharacterBubble>
        <CharacterBubble name="Nova">
          Exactly. Let’s check three ending prices:
          <ul className="list-disc list-inside mt-1">
            <li>
              If the stock ends at <strong>80</strong>: your right to buy at 100 is useless. You lose the 5 dollar premium.
            </li>
            <li>
              If it ends at <strong>100</strong>: still useless. You lose 5 dollars.
            </li>
            <li>
              If it ends at <strong>120</strong>: your right to buy at 100 is worth 20 dollars. You paid 5, so your profit is 15.
            </li>
          </ul>
        </CharacterBubble>
      </div>
    </SectionCard>
  );
};

const PutLesson: React.FC = () => {
  const K = CONFIG.SCENARIO_STRIKE_ATM;
  const premium = 4;
  return (
    <SectionCard title="Step 4: Put Options in Plain English" subtitle="A put = a deal that lets you sell later at a fixed price.">
      <FuturePhoneCard />
      <div className="mt-4 space-y-2">
        <CharacterBubble name="Nova">
          Now a put option is the mirror idea.
          <br />
          Try this deal:
          <ul className="list-disc list-inside mt-1">
            <li>Strike price K = ${K}</li>
            <li>Premium = ${premium}</li>
          </ul>
          You pay 4 dollars now. You get the right to <strong>sell</strong> {CONFIG.SCENARIO_STOCK_NAME} at 100.
        </CharacterBubble>
        <CharacterBubble name="Sky">
          So now I’m happy if the stock goes <strong>down</strong>, because I can sell at 100 even if it’s cheaper in the market?
        </CharacterBubble>
        <CharacterBubble name="Nova">
          Exactly. Quick examples:
          <ul className="list-disc list-inside mt-1">
            <li>
              If the stock ends at <strong>80</strong>: your right to sell at 100 is worth 20. You paid 4, so your profit is 16.
            </li>
            <li>
              At <strong>100</strong> or <strong>120</strong>: the put is worthless. You just lose the 4 dollar premium.
            </li>
          </ul>
          A call is like hoping for a big move <strong>up</strong>. A put is like hoping for a big move <strong>down</strong>.
        </CharacterBubble>
      </div>
    </SectionCard>
  );
};

const MachineLesson: React.FC = () => {
  return (
    <SectionCard title="Step 5: The Options Machine" subtitle="Play with the dials and see how everything connects.">
      <FuturePhoneCard />
      <div className="mt-4 space-y-2">
        <CharacterBubble name="Nova">
          Time to build your mental “options machine”. On the left you control the inputs: stock price, strike, days until expiration,
          volatility, option type, and whether you’re the buyer or seller.
        </CharacterBubble>
        <CharacterBubble name="Nova">
          On the right you’ll see what the machine spits out: intrinsic value, time value, total value, and what your profit or loss would
          be if time ended today.
        </CharacterBubble>
        <CharacterBubble name="Sky">
          So if I slide the stock price up and down, I’m basically checking, “What if the stock ends here?” And the graph shows how good
          or bad that is for me?
        </CharacterBubble>
      </div>
      <OptionsMachine />
    </SectionCard>
  );
};

const TimeLesson: React.FC = () => {
  return (
    <SectionCard title="Step 6: Time & Time Decay (Theta)" subtitle="Why options slowly lose their ‘maybe’ value.">
      <FuturePhoneCard />
      <div className="mt-4 space-y-2">
        <CharacterBubble name="Nova">
          Every option price is made of two parts:
          <ul className="list-disc list-inside mt-1">
            <li>
              <strong>Intrinsic value</strong> – how much it’s “in the money” right now.
            </li>
            <li>
              <strong>Time value</strong> – extra value from the possibility that things might move in your favor before the deadline.
            </li>
          </ul>
        </CharacterBubble>
        <CharacterBubble name="Nova">
          As days go by and we get closer to expiration, the “maybe” part fades away. That’s called <strong>time decay</strong>, and
          traders use a Greek letter, theta, to talk about how fast it’s melting.
        </CharacterBubble>
        <CharacterBubble name="Sky">
          So time is like a melting ice cream on top of the cone. The cone itself is the intrinsic value, and as time passes, the scoop
          melts away?
        </CharacterBubble>
        <CharacterBubble name="Nova" tone="secondary">
          Perfect cartoon analogy. You can see it in the machine by sliding “Days to expiry” down to 0 and watching the time value shrink.
        </CharacterBubble>
      </div>
    </SectionCard>
  );
};

const VolatilityLesson: React.FC = () => {
  return (
    <SectionCard title="Step 7: Volatility – How Wild Can the Price Move?" subtitle="Bigger swings in price make options more valuable.">
      <FuturePhoneCard />
      <div className="mt-4 space-y-2">
        <CharacterBubble name="Nova">Volatility is just “how much the price jumps around over time”.</CharacterBubble>
        <CharacterBubble name="Sky">
          So low volatility = price mostly floats near 100. High volatility = price bounces around like crazy between, say, 60 and 140?
        </CharacterBubble>
        <CharacterBubble name="Nova" tone="secondary">
          Exactly. For options, higher volatility usually means more <strong>time value</strong>. There’s more chance the option ends up
          deep in the money. Slide the volatility knob in the machine and watch the time value react.
        </CharacterBubble>
        <CharacterBubble name="Nova">
          Traders use another Greek, <strong>vega</strong>, to measure how much the option price changes when volatility changes. For you
          right now, just remember: bigger possible moves = more valuable options.
        </CharacterBubble>
      </div>
    </SectionCard>
  );
};

const StrategyLesson: React.FC = () => {
  return (
    <SectionCard title="Step 8: Simple Option Strategies" subtitle="Mixing stock + calls + puts to shape your payoff.">
      <FuturePhoneCard />
      <div className="mt-4 space-y-2">
        <CharacterBubble name="Nova">
          Once you understand calls and puts, you can combine them to create shapes you like:
          <ul className="list-disc list-inside mt-1">
            <li>
              <strong>Covered call</strong> – own the stock, sell a call. You get extra income but give up some upside.
            </li>
            <li>
              <strong>Protective put</strong> – own the stock, buy a put. You’ve basically bought insurance against big drops.
            </li>
            <li>
              <strong>Straddle</strong> – buy a call and a put at the same strike. You win if the price moves a lot, up or down.
            </li>
          </ul>
        </CharacterBubble>
        <CharacterBubble name="Sky">
          So it’s like building a custom “if the price goes here, I win this much; if it goes there, I lose that much” shape using Lego
          blocks of stock + options?
        </CharacterBubble>
        <CharacterBubble name="Nova" tone="secondary">
          Exactly. Those Lego blocks are always the same: calls, puts, and shares of {CONFIG.SCENARIO_STOCK_NAME}. The machine just shows
          how each combo behaves.
        </CharacterBubble>
      </div>
    </SectionCard>
  );
};

const RiskLesson: React.FC = () => {
  return (
    <SectionCard title="Step 9: Risks & Safety Warnings" subtitle="Options are powerful. Power needs respect.">
      <FuturePhoneCard />
      <div className="mt-4 space-y-2">
        <CharacterBubble name="Nova">Options can be exciting, but they can also be dangerous if you don’t understand them.</CharacterBubble>
        <CharacterBubble name="Nova">
          Some key rules:
          <ul className="list-disc list-inside mt-1">
            <li>If you <strong>buy</strong> an option, your worst-case loss is usually the premium you paid.</li>
            <li>
              If you <strong>sell</strong> certain options without protection (like a naked call), your losses can be very large if the
              stock moves against you.
            </li>
            <li>This app is educational, not trading advice. Real money is serious; learn the rules and risks first.</li>
          </ul>
        </CharacterBubble>
        <CharacterBubble name="Sky">
          Got it. Options are like power tools. Super useful, but you don’t just wave them around without understanding what they can do.
        </CharacterBubble>
      </div>
    </SectionCard>
  );
};

const WrapLesson: React.FC = () => {
  return (
    <SectionCard title="Step 10: You Can Now ‘See’ Inside the Options Machine" subtitle="Quick recap of your new mental model.">
      <FuturePhoneCard />
      <div className="mt-4 space-y-2">
        <CharacterBubble name="Nova">
          Let’s recap what you’ve learned:
          <ul className="list-disc list-inside mt-1">
            <li>A stock is a tiny piece of a company.</li>
            <li>
              A <strong>call</strong> is a right to buy later at a fixed price K.
            </li>
            <li>
              A <strong>put</strong> is a right to sell later at a fixed price K.
            </li>
            <li>
              Option value = <strong>intrinsic value</strong> + <strong>time value</strong>.
            </li>
            <li>
              Time value melts as the deadline gets closer (time decay / theta).
            </li>
            <li>Volatility is how wild prices can move; more volatility usually means more option value.</li>
          </ul>
        </CharacterBubble>
        <CharacterBubble name="Sky">
          And the options machine lets me plug in S, K, time, volatility, and position, and actually see how my profit or loss changes.
          It’s like an x-ray for option deals.
        </CharacterBubble>
        <CharacterBubble name="Nova" tone="secondary">
          Exactly. You don’t just memorize formulas. You <strong>see</strong> how everything flows: inputs → machine → payoff graph. That’s
          the superpower.
        </CharacterBubble>
      </div>
    </SectionCard>
  );
};

// ======================================================
// App (step navigation)
// ======================================================

interface LessonDef {
  id: string;
  label: string;
  component: React.FC;
}

const LESSONS: LessonDef[] = [
  { id: 'intro', label: 'Welcome', component: IntroLesson },
  { id: 'stock', label: 'What is a stock?', component: StockBasicsLesson },
  { id: 'why', label: 'Why options?', component: WhyOptionsLesson },
  { id: 'call', label: 'Call options', component: CallLesson },
  { id: 'put', label: 'Put options', component: PutLesson },
  { id: 'machine', label: 'Options Machine', component: MachineLesson },
  { id: 'time', label: 'Time & decay', component: TimeLesson },
  { id: 'vol', label: 'Volatility', component: VolatilityLesson },
  { id: 'strategies', label: 'Strategies', component: StrategyLesson },
  { id: 'risk', label: 'Risks', component: RiskLesson },
  { id: 'wrap', label: 'Wrap-up', component: WrapLesson },
];

const App: React.FC = () => {
  const [stepIndex, setStepIndex] = useState(0);
  const CurrentLesson = LESSONS[stepIndex].component;
  const progressPercent = ((stepIndex + 1) / LESSONS.length) * 100;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: `radial-gradient(circle at top, #1e293b 0, ${CONFIG.BACKGROUND_COLOR} 45%, #020617 100%)`,
        fontFamily: CONFIG.TEXT_FONT,
      }}
    >
      {/* Top bar */}
      <header className="w-full border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-lg font-bold"
              style={{
                background: `linear-gradient(135deg, ${CONFIG.PRIMARY_COLOR}, ${CONFIG.SECONDARY_COLOR})`,
                color: '#020617',
              }}
            >
              ⚙️
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold text-slate-100">{CONFIG.APP_TITLE}</span>
              <span className="text-xs text-slate-400">Interactive cartoon course · Age 15+</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-3 text-xs text-slate-400">
            <span>
              Step {stepIndex + 1} / {LESSONS.length}
            </span>
            <div className="w-40 h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${progressPercent}%`,
                  background: `linear-gradient(90deg, ${CONFIG.PRIMARY_COLOR}, ${CONFIG.SECONDARY_COLOR})`,
                }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center px-3 py-4 md:py-8">
        <CurrentLesson />
      </main>

      {/* Bottom nav */}
      <footer className="w-full border-t border-slate-800/80 bg-slate-950/70 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3 text-xs md:text-sm">
          <div className="hidden md:flex gap-2 flex-wrap">
            {LESSONS.map((step, idx) => (
              <button
                key={step.id}
                onClick={() => setStepIndex(idx)}
                className={`px-2.5 py-1 rounded-full border text-[11px] transition ${
                  idx === stepIndex
                    ? 'border-sky-400 bg-sky-500/20 text-sky-100'
                    : 'border-slate-700 bg-slate-900/60 text-slate-300 hover:border-slate-500'
                }`}
              >
                {idx + 1}. {step.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
              disabled={stepIndex === 0}
              className={`px-3 py-1.5 rounded-full border text-xs md:text-sm ${
                stepIndex === 0
                  ? 'border-slate-700 text-slate-500 cursor-not-allowed'
                  : 'border-slate-600 text-slate-200 hover:border-slate-400'
              }`}
            >
              ← Back
            </button>
            <button
              onClick={() => setStepIndex((i) => Math.min(LESSONS.length - 1, i + 1))}
              disabled={stepIndex === LESSONS.length - 1}
              className={`px-3 py-1.5 rounded-full border text-xs md:text-sm ${
                stepIndex === LESSONS.length - 1
                  ? 'border-slate-700 text-slate-500 cursor-not-allowed'
                  : 'border-sky-500 text-slate-950 bg-sky-400 hover:bg-sky-300'
              }`}
            >
              Next →
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
