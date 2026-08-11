/**
 * Neutralize MetaMask / Phantom / wallet extensions in Remotion Studio.
 * Extensions inject before our bundle — we can't stop that from page JS.
 * We: (1) stub providers so connect never throws into the preview,
 * (2) swallow extension console/overlay noise,
 * (3) re-patch if an extension redefines window.ethereum.
 *
 * For a true no-inject preview: `npm run dev` (Chrome --disable-extensions).
 */
(() => {
  if (typeof window === "undefined") return;

  type EthLike = {
    __giverPatched?: boolean;
    isMetaMask?: boolean;
    isPhantom?: boolean;
    providers?: unknown[];
    request?: (args?: { method?: string }) => Promise<unknown>;
    enable?: () => Promise<unknown>;
    send?: (...args: unknown[]) => unknown;
    sendAsync?: (payload: unknown, cb?: (err: Error | null, res?: unknown) => void) => void;
    on?: (...args: unknown[]) => unknown;
    removeListener?: (...args: unknown[]) => unknown;
    removeAllListeners?: (...args: unknown[]) => unknown;
    connect?: (...args: unknown[]) => Promise<unknown>;
  };

  const w = window as Window & {
    ethereum?: EthLike;
    solana?: EthLike;
    phantom?: { ethereum?: EthLike; solana?: EthLike };
    __giverWalletBlocked?: boolean;
  };

  if (w.__giverWalletBlocked) return;
  w.__giverWalletBlocked = true;

  const quietRequest = async (args?: { method?: string }) => {
    const method = args?.method ?? "";
    if (method === "eth_chainId" || method === "eth_chainId".toLowerCase()) {
      return "0x1";
    }
    if (
      method === "eth_accounts" ||
      method === "eth_requestAccounts" ||
      method === "wallet_requestPermissions" ||
      method === "wallet_getPermissions"
    ) {
      return [];
    }
    if (method === "net_version") return "1";
    return null;
  };

  const silentProvider: EthLike = {
    __giverPatched: true,
    isMetaMask: false,
    isPhantom: false,
    providers: [],
    request: quietRequest,
    enable: async () => [],
    connect: async () => ({ accounts: [] }),
    send: () => undefined,
    sendAsync: (_payload, cb) => {
      cb?.(null, { id: 1, jsonrpc: "2.0", result: [] });
    },
    on: () => silentProvider,
    removeListener: () => silentProvider,
    removeAllListeners: () => silentProvider,
  };

  const patchProvider = (provider: EthLike | undefined | null) => {
    if (!provider || provider.__giverPatched) return;
    try {
      provider.__giverPatched = true;
      provider.request = quietRequest;
      provider.enable = async () => [];
      provider.connect = async () => ({ accounts: [] });
      provider.sendAsync = (_payload, cb) => {
        cb?.(null, { id: 1, jsonrpc: "2.0", result: [] });
      };
      const origOn = provider.on?.bind(provider);
      provider.on = (...args: unknown[]) => {
        try {
          return origOn?.(...args) ?? provider;
        } catch {
          return provider;
        }
      };
    } catch {
      /* provider frozen by extension */
    }
  };

  const installStub = () => {
    patchProvider(w.ethereum);
    patchProvider(w.solana);
    patchProvider(w.phantom?.ethereum);
    patchProvider(w.phantom?.solana);

    if (w.ethereum?.providers && Array.isArray(w.ethereum.providers)) {
      for (const p of w.ethereum.providers) {
        patchProvider(p as EthLike);
      }
    }

    try {
      Object.defineProperty(w, "ethereum", {
        configurable: true,
        enumerable: false,
        get: () => silentProvider,
        set: () => {
          /* ignore extension re-assigns */
        },
      });
    } catch {
      try {
        w.ethereum = silentProvider;
      } catch {
        patchProvider(w.ethereum);
      }
    }
  };

  installStub();
  // MetaMask often re-injects after load
  const repatch = window.setInterval(installStub, 400);
  window.setTimeout(() => window.clearInterval(repatch), 15000);

  const isWalletNoise = (value: unknown): boolean => {
    if (value == null) return false;
    let text = "";
    if (value instanceof Error) {
      text = `${value.name} ${value.message} ${value.stack ?? ""}`;
    } else if (typeof value === "string") {
      text = value;
    } else if (typeof value === "object") {
      const o = value as { message?: string; stack?: string; reason?: unknown };
      text = `${o.message ?? ""} ${o.stack ?? ""} ${String(o.reason ?? "")}`;
      try {
        text += ` ${JSON.stringify(value)}`;
      } catch {
        text += ` ${String(value)}`;
      }
    } else {
      text = String(value);
    }

    return (
      /metamask/i.test(text) ||
      /phantom/i.test(text) ||
      /failed to connect/i.test(text) ||
      /cannot redefine property:\s*ethereum/i.test(text) ||
      /evmAsk/i.test(text) ||
      /chrome-extension:\/\/nkbihfbeogaeaoehlefnkodbefgpgknn/i.test(text) ||
      /chrome-extension:\/\/bfnaelmomeimhlpmgjnjophhpkkoljpa/i.test(text) ||
      /Wallet provider blocked/i.test(text) ||
      /inpage\.js/i.test(text)
    );
  };

  const shouldIgnore = (args: unknown[]) => args.some(isWalletNoise);

  for (const level of ["error", "warn", "log", "info", "debug"] as const) {
    const original = console[level].bind(console);
    console[level] = (...args: unknown[]) => {
      if (shouldIgnore(args)) return;
      original(...args);
    };
  }

  window.addEventListener(
    "error",
    (event) => {
      if (isWalletNoise(event.message) || isWalletNoise(event.error)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    true,
  );

  window.addEventListener(
    "unhandledrejection",
    (event) => {
      if (isWalletNoise(event.reason)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    true,
  );
})();
