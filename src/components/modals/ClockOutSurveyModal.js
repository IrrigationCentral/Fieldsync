// ============================================
// CLOCK OUT SURVEY MODAL - Option C Implementation
// Survey-style questions when clocking out
// Each time entry becomes a "daily sheet" with notes
// ============================================
import React, { useState } from 'react';
import { Modal, Button } from '../ui';
import { 
  AlertCircle, Wrench, CheckCircle, Package, FileText,
  ChevronRight, ChevronLeft
} from 'lucide-react';

const ClockOutSurveyModal = ({
  isOpen,
  onClose,
  onComplete,
  job,
  colors,
  isLoading
}) => {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState({
    whatWasProblem: '',
    whatDidYouDo: '',
    isJobComplete: null, // true = complete, false = needs follow-up
    partsNeeded: '',
    additionalNotes: '',
    lunchTaken: false
  });

  const totalSteps = 5;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = () => {
    // Compile all answers into session notes
    const sessionNotes = compileNotes();
    onComplete({
      sessionNotes,
      lunchTaken: answers.lunchTaken,
      isJobComplete: answers.isJobComplete,
      partsNeeded: answers.partsNeeded,
      rawAnswers: answers
    });
  };

  const compileNotes = () => {
    let notes = '';
    
    if (answers.whatWasProblem.trim()) {
      notes += `PROBLEM: ${answers.whatWasProblem.trim()}\n`;
    }
    if (answers.whatDidYouDo.trim()) {
      notes += `WORK DONE: ${answers.whatDidYouDo.trim()}\n`;
    }
    if (answers.isJobComplete !== null) {
      notes += `STATUS: ${answers.isJobComplete ? 'Job Complete' : 'Needs Follow-up'}\n`;
    }
    if (answers.partsNeeded.trim()) {
      notes += `PARTS NEEDED: ${answers.partsNeeded.trim()}\n`;
    }
    if (answers.additionalNotes.trim()) {
      notes += `NOTES: ${answers.additionalNotes.trim()}`;
    }
    
    return notes.trim();
  };

  const canProceed = () => {
    switch (step) {
      case 1: return answers.whatWasProblem.trim().length > 0;
      case 2: return answers.whatDidYouDo.trim().length > 0;
      case 3: return answers.isJobComplete !== null;
      case 4: return true; // Parts needed is optional
      case 5: return true; // Additional notes is optional
      default: return false;
    }
  };

  const handleClose = () => {
    // Reset state
    setStep(1);
    setAnswers({
      whatWasProblem: '',
      whatDidYouDo: '',
      isJobComplete: null,
      partsNeeded: '',
      additionalNotes: '',
      lunchTaken: false
    });
    onClose();
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" 
                style={{ backgroundColor: colors.warning + '20' }}>
                <AlertCircle className="w-6 h-6" style={{ color: colors.warning }} />
              </div>
              <div>
                <h3 className="text-xl font-bold" style={{ color: colors.textPrimary }}>
                  What was the problem?
                </h3>
                <p className="text-sm" style={{ color: colors.textSecondary }}>
                  Describe what you found when you arrived
                </p>
              </div>
            </div>
            <textarea
              value={answers.whatWasProblem}
              onChange={(e) => setAnswers({...answers, whatWasProblem: e.target.value})}
              placeholder="e.g., Span 3 wasn't moving, motor was making grinding noise..."
              className="w-full p-4 rounded-xl text-lg min-h-[150px] resize-none"
              style={{ 
                backgroundColor: colors.inputBg, 
                borderColor: colors.border,
                color: colors.textPrimary,
                border: `2px solid ${colors.border}`,
                fontSize: '16px'
              }}
              autoFocus
            />
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" 
                style={{ backgroundColor: colors.primary + '20' }}>
                <Wrench className="w-6 h-6" style={{ color: colors.primary }} />
              </div>
              <div>
                <h3 className="text-xl font-bold" style={{ color: colors.textPrimary }}>
                  What did you do to fix it?
                </h3>
                <p className="text-sm" style={{ color: colors.textSecondary }}>
                  Describe the work you performed
                </p>
              </div>
            </div>
            <textarea
              value={answers.whatDidYouDo}
              onChange={(e) => setAnswers({...answers, whatDidYouDo: e.target.value})}
              placeholder="e.g., Replaced motor bearings, realigned gearbox, tested full rotation..."
              className="w-full p-4 rounded-xl text-lg min-h-[150px] resize-none"
              style={{ 
                backgroundColor: colors.inputBg, 
                borderColor: colors.border,
                color: colors.textPrimary,
                border: `2px solid ${colors.border}`,
                fontSize: '16px'
              }}
              autoFocus
            />
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" 
                style={{ backgroundColor: colors.success + '20' }}>
                <CheckCircle className="w-6 h-6" style={{ color: colors.success }} />
              </div>
              <div>
                <h3 className="text-xl font-bold" style={{ color: colors.textPrimary }}>
                  Is the job complete?
                </h3>
                <p className="text-sm" style={{ color: colors.textSecondary }}>
                  Or does it need a follow-up visit?
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <button
                onClick={() => setAnswers({...answers, isJobComplete: true})}
                className="p-6 rounded-xl text-left transition-all"
                style={{ 
                  backgroundColor: answers.isJobComplete === true ? colors.success + '20' : colors.cardBg,
                  border: `3px solid ${answers.isJobComplete === true ? colors.success : colors.border}`
                }}
              >
                <div className="flex items-center space-x-4">
                  <CheckCircle className="w-8 h-8" style={{ color: answers.isJobComplete === true ? colors.success : colors.muted }} />
                  <div>
                    <p className="text-lg font-bold" style={{ color: colors.textPrimary }}>Yes, Job Complete</p>
                    <p className="text-sm" style={{ color: colors.textSecondary }}>Everything is fixed and working</p>
                  </div>
                </div>
              </button>
              <button
                onClick={() => setAnswers({...answers, isJobComplete: false})}
                className="p-6 rounded-xl text-left transition-all"
                style={{ 
                  backgroundColor: answers.isJobComplete === false ? colors.warning + '20' : colors.cardBg,
                  border: `3px solid ${answers.isJobComplete === false ? colors.warning : colors.border}`
                }}
              >
                <div className="flex items-center space-x-4">
                  <AlertCircle className="w-8 h-8" style={{ color: answers.isJobComplete === false ? colors.warning : colors.muted }} />
                  <div>
                    <p className="text-lg font-bold" style={{ color: colors.textPrimary }}>Needs Follow-up</p>
                    <p className="text-sm" style={{ color: colors.textSecondary }}>More work or parts required</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" 
                style={{ backgroundColor: colors.water + '20' }}>
                <Package className="w-6 h-6" style={{ color: colors.water }} />
              </div>
              <div>
                <h3 className="text-xl font-bold" style={{ color: colors.textPrimary }}>
                  Any parts needed?
                </h3>
                <p className="text-sm" style={{ color: colors.textSecondary }}>
                  {answers.isJobComplete ? 'For future reference' : 'For the follow-up visit'}
                </p>
              </div>
            </div>
            <textarea
              value={answers.partsNeeded}
              onChange={(e) => setAnswers({...answers, partsNeeded: e.target.value})}
              placeholder="e.g., Need 2x gearbox seals, 1x drive shaft coupler..."
              className="w-full p-4 rounded-xl text-lg min-h-[120px] resize-none"
              style={{ 
                backgroundColor: colors.inputBg, 
                borderColor: colors.border,
                color: colors.textPrimary,
                border: `2px solid ${colors.border}`,
                fontSize: '16px'
              }}
              autoFocus
            />
            <p className="text-sm text-center" style={{ color: colors.muted }}>
              Skip if no parts needed
            </p>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" 
                style={{ backgroundColor: colors.accent + '20' }}>
                <FileText className="w-6 h-6" style={{ color: colors.accent }} />
              </div>
              <div>
                <h3 className="text-xl font-bold" style={{ color: colors.textPrimary }}>
                  Anything else to note?
                </h3>
                <p className="text-sm" style={{ color: colors.textSecondary }}>
                  Additional observations or concerns
                </p>
              </div>
            </div>
            <textarea
              value={answers.additionalNotes}
              onChange={(e) => setAnswers({...answers, additionalNotes: e.target.value})}
              placeholder="e.g., Customer mentioned they want a quote for new drops..."
              className="w-full p-4 rounded-xl text-lg min-h-[120px] resize-none"
              style={{ 
                backgroundColor: colors.inputBg, 
                borderColor: colors.border,
                color: colors.textPrimary,
                border: `2px solid ${colors.border}`,
                fontSize: '16px'
              }}
              autoFocus
            />
            
            {/* Lunch Toggle */}
            <div className="p-4 rounded-xl" style={{ backgroundColor: colors.background }}>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-lg" style={{ color: colors.textPrimary }}>Did you take lunch?</span>
                <div 
                  onClick={() => setAnswers({...answers, lunchTaken: !answers.lunchTaken})}
                  className="relative w-14 h-8 rounded-full transition-colors cursor-pointer"
                  style={{ backgroundColor: answers.lunchTaken ? colors.primary : colors.border }}
                >
                  <div 
                    className="absolute top-1 w-6 h-6 rounded-full bg-white transition-transform shadow"
                    style={{ 
                      transform: answers.lunchTaken ? 'translateX(28px)' : 'translateX(4px)'
                    }}
                  />
                </div>
              </label>
              {answers.lunchTaken && (
                <p className="text-sm mt-2" style={{ color: colors.textSecondary }}>
                  30 minutes will be deducted from your time
                </p>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      title={`Clock Out - ${job?.title || 'Job'}`}
      size="lg"
    >
      <div className="min-h-[400px] flex flex-col">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium" style={{ color: colors.textSecondary }}>
              Step {step} of {totalSteps}
            </span>
            <span className="text-sm" style={{ color: colors.muted }}>
              {Math.round((step / totalSteps) * 100)}% complete
            </span>
          </div>
          <div className="h-2 rounded-full" style={{ backgroundColor: colors.border }}>
            <div 
              className="h-2 rounded-full transition-all duration-300"
              style={{ 
                backgroundColor: colors.primary,
                width: `${(step / totalSteps) * 100}%`
              }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="flex-1">
          {renderStep()}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t" style={{ borderColor: colors.border }}>
          {step > 1 ? (
            <Button 
              variant="secondary" 
              onClick={handleBack}
              icon={ChevronLeft}
            >
              Back
            </Button>
          ) : (
            <Button 
              variant="secondary" 
              onClick={handleClose}
            >
              Cancel
            </Button>
          )}

          {step < totalSteps ? (
            <Button 
              onClick={handleNext}
              disabled={!canProceed()}
              icon={ChevronRight}
              iconPosition="right"
            >
              Next
            </Button>
          ) : (
            <Button 
              onClick={handleComplete}
              loading={isLoading}
              style={{ backgroundColor: colors.success }}
            >
              Complete Clock Out
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ClockOutSurveyModal;
