'use client';

import React from 'react';
import { Provider } from 'react-redux';
import { makeStore } from '@/lib/store';

export default function ReduxProvider({ children }: { children: React.ReactNode }) {
  return <Provider store={makeStore()}>{children}</Provider>;
}
