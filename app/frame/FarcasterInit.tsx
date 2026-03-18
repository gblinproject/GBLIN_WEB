'use client';

import { useEffect } from 'react';
import sdk from '@farcaster/frame-sdk';

export default function FarcasterInit() {
  useEffect(() => {
    const init = async () => {
      try {
        await sdk.actions.ready();
      } catch (e) {
        console.error("Farcaster SDK init error:", e);
      }
    };
    init();
  }, []);

  return null;
}
