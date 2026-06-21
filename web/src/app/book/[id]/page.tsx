"use client";

import dynamic from 'next/dynamic';

const ReaderContent = dynamic(() => import('./ReaderContent'), { ssr: false });

export default function BookReaderPage() {
  return <ReaderContent />;
}
