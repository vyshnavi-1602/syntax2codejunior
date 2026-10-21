import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/client/components/ui/dialog";
import { SpaceInvadersGame } from "./SpaceInvadersGame";
import { Sparkles, Trophy, Rocket, ArrowRight, Zap, CheckCircle2 } from "lucide-react";
import { Button } from "@/client/components/ui/button";

interface SpaceInvadersRewardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  xpEarned?: number;
  challengeTitle?: string;
  onNextQuestion?: () => void;
  nextQuestionLabel?: string;
}

export function SpaceInvadersRewardModal({
  open,
  onOpenChange,
  xpEarned = 50,
  challengeTitle = "Practice Challenge",
  onNextQuestion,
  nextQuestionLabel = "Next Challenge",
}: SpaceInvadersRewardModalProps) {
  const [isPlayingGame, setIsPlayingGame] = useState(false);

  const handleClose = () => {
    setIsPlayingGame(false);
    onOpenChange(false);
  };

  const handleNext = () => {
    setIsPlayingGame(false);
    onOpenChange(false);
    if (onNextQuestion) {
      onNextQuestion();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-3xl p-0 overflow-hidden border border-slate-700 bg-slate-950 shadow-2xl">
        <DialogTitle className="sr-only">
          {isPlayingGame ? "Space Invaders Arcade Break" : "Challenge Solved!"}
        </DialogTitle>
        {!isPlayingGame ? (
          <div className="relative p-6 sm:p-8 text-center flex flex-col items-center justify-center overflow-hidden">
            {/* Ambient Background Glows */}
            <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-4 animate-bounce">
              <CheckCircle2 className="h-4 w-4" /> Code Verified & Passed!
            </div>

            <div className="relative mb-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-emerald-600 via-sky-500 to-teal-400 text-white shadow-xl shadow-emerald-500/30">
                <Rocket className="h-10 w-10 animate-pulse" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-amber-400 text-slate-950 font-bold text-xs shadow-md">
                +{xpEarned}
              </span>
            </div>

            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Brilliant Solve! 🎉
            </h2>

            <p className="mt-2 text-sm text-slate-300 max-w-md">
              You cracked <strong className="text-emerald-300">{challengeTitle}</strong> with 100%
              correct test cases!
            </p>

            <div className="mt-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-left w-full max-w-md flex items-center gap-3.5">
              <span className="text-2xl">👾</span>
              <div>
                <p className="text-xs font-semibold text-white">Space Invaders Unlocked!</p>
                <p className="text-[11px] text-slate-400">
                  Take a quick 2-minute brain break to blast retro aliens, or skip to continue
                  practice.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row items-center gap-3 w-full max-w-md justify-center">
              <Button
                onClick={() => setIsPlayingGame(true)}
                className="w-full sm:w-auto flex-1 h-11 bg-gradient-to-r from-emerald-600 to-sky-600 hover:from-emerald-500 hover:to-sky-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 gap-2 cursor-pointer"
              >
                <Zap className="h-4 w-4 text-amber-300" /> Play Space Invaders
              </Button>

              <Button
                variant="outline"
                onClick={handleNext}
                className="w-full sm:w-auto h-11 border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-200 hover:text-white text-sm font-semibold gap-1.5 cursor-pointer"
              >
                Skip & {nextQuestionLabel} <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            <button
              onClick={handleClose}
              className="mt-4 text-xs text-slate-500 hover:text-slate-300 transition"
            >
              Close & stay on this problem
            </button>
          </div>
        ) : (
          <SpaceInvadersGame
            onClose={handleClose}
            onNextQuestion={handleNext}
            nextQuestionLabel={nextQuestionLabel}
            sourceContext={`Solved: ${challengeTitle} (+${xpEarned} XP)`}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
