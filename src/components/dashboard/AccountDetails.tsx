/**
 * AccountDetails — Shows wallet address, access token alias, and session status.
 *
 * Reads from the Zustand auth store. Used inside the DashboardInteractive island.
 */

import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { decodeJWTPayload } from "@/lib/andamio-auth";
import { Card, CardHeader, CardBody } from "@/components/ui/card";

function truncateAddress(addr: string): string {
  if (addr.length <= 20) return addr;
  return `${addr.slice(0, 12)}...${addr.slice(-8)}`;
}

function formatExpiry(exp: number): string {
  const remaining = exp * 1000 - Date.now();
  if (remaining <= 0) return "Expired";
  const mins = Math.floor(remaining / 60_000);
  const hours = Math.floor(mins / 60);
  if (hours > 0) return `${hours}h ${mins % 60}m`;
  return `${mins}m`;
}

export function AccountDetails() {
  const user = useAuthStore((s) => s.user);
  const jwt = useAuthStore((s) => s.jwt);
  const walletAddress = useAuthStore((s) => s.walletAddress);
  const [copied, setCopied] = useState(false);
  const [expiry, setExpiry] = useState<string>("");

  useEffect(() => {
    if (!jwt) return;
    const payload = decodeJWTPayload(jwt);
    if (!payload?.exp) return;

    const update = () => setExpiry(formatExpiry(payload.exp!));
    update();
    const interval = setInterval(update, 30_000);
    return () => clearInterval(interval);
  }, [jwt]);

  const copyAddress = useCallback(async () => {
    if (!walletAddress) return;
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable
    }
  }, [walletAddress]);

  if (!user) return null;

  const address = walletAddress ?? user.address;

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold font-heading text-mn-text">
          Account
        </h2>
      </CardHeader>
      <CardBody>
        <dl className="grid gap-5 sm:grid-cols-3">
          {/* Access Token */}
          <div>
            <dt className="text-xs text-mn-text-muted uppercase tracking-wider mb-1.5">
              Access Token
            </dt>
            <dd className="text-sm font-mono">
              {user.alias ? (
                <span className="text-mn-primary font-medium">{user.alias}</span>
              ) : (
                <span className="text-mn-text-muted italic">Not minted</span>
              )}
            </dd>
          </div>

          {/* Wallet Address */}
          <div>
            <dt className="text-xs text-mn-text-muted uppercase tracking-wider mb-1.5">
              Wallet
            </dt>
            <dd className="flex items-center gap-2">
              <span className="text-sm font-mono text-mn-text" title={address}>
                {truncateAddress(address)}
              </span>
              <button
                onClick={copyAddress}
                className="text-xs text-mn-text-muted hover:text-mn-text transition-colors cursor-pointer"
                aria-label="Copy wallet address"
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </dd>
          </div>

          {/* Session */}
          <div>
            <dt className="text-xs text-mn-text-muted uppercase tracking-wider mb-1.5">
              Session
            </dt>
            <dd className="text-sm">
              {jwt && expiry ? (
                <span className="text-green-400">
                  Active
                  <span className="text-mn-text-muted ml-2 text-xs">
                    {expiry} remaining
                  </span>
                </span>
              ) : (
                <span className="text-mn-text-muted">Inactive</span>
              )}
            </dd>
          </div>
        </dl>
      </CardBody>
    </Card>
  );
}
