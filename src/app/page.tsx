'use client';
import { useEffect } from 'react';
export default function Home() {
  useEffect(() => { window.location.href = '/game'; }, []);
  return <div className="min-h-screen bg-[#1a1d23] flex items-center justify-center"><div className="w-10 h-10 border-2 border-[#dce87a] border-t-transparent rounded-full animate-spin"/></div>;
}
