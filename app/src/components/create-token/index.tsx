"use client"

import { useState } from "react";
import QuickStart from "./QuickStart";
import QuickLaunch from "./QuickLaunch";
import CustomToken from "./custom";

type CreationStep = 'selection' | 'quick' | 'custom';

export default function CreateToken() {
  const [currentStep, setCurrentStep] = useState<CreationStep>('selection');

  const handleMethodSelect = (method: 'quick' | 'custom') => {
    if (method === 'quick') {
      setCurrentStep('quick');
    } else {
      setCurrentStep('custom');
    }
  };

  const handleCancel = () => {
    setCurrentStep('selection');
  };

  switch (currentStep) {
    case 'selection':
      return <QuickStart onMethodSelect={handleMethodSelect} />;
    case 'quick':
      return <QuickLaunch onCancel={handleCancel} />;
    case 'custom':
      return <CustomToken />;
    default:
      return <QuickStart onMethodSelect={handleMethodSelect} />;
  }
}