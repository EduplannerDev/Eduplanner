"use client";

import dynamic from 'next/dynamic';

const FeedbackButton = dynamic(() => import('./ui/feedback-button').then(mod => mod.FeedbackButton), { ssr: false });

export default function FeedbackClient() {
  return <FeedbackButton />;
}