import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  CalendarDays,
  GraduationCap,
  Users,
  MessageSquare,
  Heart,
  Share2,
  Sparkles,
  Send,
  PlusCircle,
  HelpCircle,
  Code2,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Panel, Pill } from "@/client/components/app/primitives";
import { cn } from "@/client/lib/utils";
import { getStudentClubsFn } from "@/api/student.server";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/client/components/ui/dialog";
import { Button } from "@/client/components/ui/button";
import { Input } from "@/client/components/ui/input";
import { Textarea } from "@/client/components/ui/textarea";
import { Label } from "@/client/components/ui/label";

export const Route = createFileRoute("/student/clubs")({
  head: () => ({
    meta: [
      { title: "Clubs & Community · Syntax2Code" },
      {
        name: "description",
        content:
          "Join the AI, Coding, Robotics and Game Dev clubs — activity feeds, mentors and student community discussions.",
      },
      { property: "og:title", content: "Clubs & Community · Syntax2Code" },
      {
        property: "og:description",
        content: "School coding and AI clubs with live activity feeds and community discussions.",
      },
    ],
  }),
  loader: async () => await getStudentClubsFn(),
  component: ClubsPage,
});

interface ClubFeedItem {
  id: string;
  who: string;
  what: string;
  when: string;
  category: "Showcase" | "Question" | "Discussion" | "Announcement";
  likes: number;
  liked?: boolean;
  commentsCount: number;
  isMentorReply?: boolean;
}

function ClubsPage() {
  const clubs = Route.useLoaderData();
  const [joined, setJoined] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("s2c_student_joined_clubs");
      return saved ? JSON.parse(saved) : ["c-1", "c-4"];
    } catch {
      return ["c-1", "c-4"];
    }
  });
  const [activeId, setActiveId] = useState<string>(clubs[0]?.id || "c-1");
  const active = clubs.find((c) => c.id === activeId) ?? clubs[0];

  // Club feeds state
  const [feeds, setFeeds] = useState<Record<string, ClubFeedItem[]>>(() => {
    const initial: Record<string, ClubFeedItem[]> = {};
    for (const c of clubs) {
      initial[c.id] = (c.feed || []).map(
        (f: { who: string; what: string; when: string }, idx: number) => ({
          id: `${c.id}-feed-${idx}`,
          who: f.who,
          what: f.what,
          when: f.when,
          category: (idx === 0
            ? "Announcement"
            : idx % 2 === 0
              ? "Showcase"
              : "Discussion") as ClubFeedItem["category"],
          likes: 3 + idx * 2,
          liked: false,
          commentsCount: 1 + idx,
        }),
      );
    }
    return initial;
  });

  // Filter state
  const [filterCategory, setFilterCategory] = useState<string>("All");

  // Post modal state
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [postCategory, setPostCategory] = useState<"Showcase" | "Question" | "Discussion">(
    "Discussion",
  );
  const [postTitle, setPostTitle] = useState("");
  const [postContent, setPostContent] = useState("");
  const [notifyMentor, setNotifyMentor] = useState(true);

  // Ask Mentor quick modal
  const [mentorModalOpen, setMentorModalOpen] = useState(false);
  const [mentorQuestion, setMentorQuestion] = useState("");

  const handleLike = (postId: string) => {
    setFeeds((prev) => {
      const currentClubFeed = prev[activeId] || [];
      return {
        ...prev,
        [activeId]: currentClubFeed.map((item) => {
          if (item.id === postId) {
            const nextLiked = !item.liked;
            return {
              ...item,
              liked: nextLiked,
              likes: nextLiked ? item.likes + 1 : item.likes - 1,
            };
          }
          return item;
        }),
      };
    });
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim()) {
      toast.error("Please enter some content for your post.");
      return;
    }

    const newItem: ClubFeedItem = {
      id: `post-${Date.now()}`,
      who: "Aarav Gupta (You)",
      what: postTitle ? `${postTitle}: ${postContent}` : postContent,
      when: "Just now",
      category: postCategory,
      likes: 0,
      liked: false,
      commentsCount: 0,
    };

    setFeeds((prev) => ({
      ...prev,
      [activeId]: [newItem, ...(prev[activeId] || [])],
    }));

    toast.success("Post shared with the club!", {
      description: notifyMentor
        ? `Mentor ${active.mentor} has been tagged and notified.`
        : "Your update is now live in the community feed.",
    });

    setPostModalOpen(false);
    setPostTitle("");
    setPostContent("");
  };

  const handleAskMentor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mentorQuestion.trim()) {
      toast.error("Please specify your question for the mentor.");
      return;
    }

    const newItem: ClubFeedItem = {
      id: `mentor-q-${Date.now()}`,
      who: "Aarav Gupta (You)",
      what: `Question for Mentor: ${mentorQuestion}`,
      when: "Just now",
      category: "Question",
      likes: 1,
      liked: false,
      commentsCount: 0,
      isMentorReply: false,
    };

    setFeeds((prev) => ({
      ...prev,
      [activeId]: [newItem, ...(prev[activeId] || [])],
    }));

    toast.success(`Inquiry sent to ${active.mentor}!`, {
      description: "You will receive a notification when the mentor responds.",
    });

    setMentorModalOpen(false);
    setMentorQuestion("");
  };

  if (!clubs || !active) {
    return (
      <>
        <PageHeader
          title="Clubs & Community"
          subtitle="Where school builders collaborate and grow."
        />
        <Panel
          title="No clubs yet"
          description="Your school hasn't created any clubs yet."
          className="py-12 text-center"
        />
      </>
    );
  }

  const currentFeed = feeds[activeId] || [];
  const filteredFeed =
    filterCategory === "All"
      ? currentFeed
      : currentFeed.filter((item) => item.category === filterCategory);

  return (
    <>
      <PageHeader
        title="Clubs & Community"
        subtitle="Collaborate on student projects, discuss coding ideas, and learn directly with mentors."
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {clubs.map((c) => {
          const isJoined = joined.includes(c.id);
          return (
            <div
              key={c.id}
              onClick={() => setActiveId(c.id)}
              className={cn(
                "cursor-pointer rounded-2xl border bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-md",
                activeId === c.id
                  ? "border-indigo-300 ring-2 ring-indigo-100 shadow-sm"
                  : "border-slate-200",
              )}
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-50 to-teal-50 text-indigo-600">
                  <Users className="h-5 w-5" />
                </span>
                {isJoined ? (
                  <Pill tone="emerald">Member</Pill>
                ) : (
                  <span className="text-[11px] font-semibold text-slate-400">Open</span>
                )}
              </div>
              <h3 className="mt-3 text-sm font-semibold text-slate-900">{c.name}</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-500 line-clamp-2">{c.blurb}</p>

              <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-indigo-100/70 bg-indigo-50/60 px-2.5 py-1 text-xs font-medium text-indigo-700 w-full">
                <GraduationCap className="h-3.5 w-3.5 shrink-0 text-indigo-600" />
                <span className="truncate">
                  Mentor: <strong className="font-semibold">{c.mentor}</strong>
                </span>
              </div>

              <p className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400">
                <CalendarDays className="h-3.5 w-3.5" /> {c.meets} · {c.members} members
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setJoined((j) => {
                    const next = isJoined ? j.filter((x) => x !== c.id) : [...j, c.id];
                    try {
                      localStorage.setItem("s2c_student_joined_clubs", JSON.stringify(next));
                    } catch {
                      // ignore
                    }
                    return next;
                  });
                  toast.success(isJoined ? `Left ${c.name}` : `Joined ${c.name}`, {
                    description: isJoined
                      ? "You can rejoin at any time."
                      : `You now have full member access. Mentor: ${c.mentor}`,
                  });
                }}
                className={cn(
                  "mt-4 h-9 w-full rounded-xl text-xs font-semibold transition-colors cursor-pointer",
                  isJoined
                    ? "border border-slate-200 text-slate-600 hover:bg-slate-50"
                    : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm",
                )}
              >
                {isJoined ? "Leave Club" : "Join Club"}
              </button>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel
          className="lg:col-span-2"
          title={`${active.name} · Community Feed`}
          action={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMentorModalOpen(true)}
                className="h-8 gap-1.5 border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-xs"
              >
                <HelpCircle className="h-3.5 w-3.5 text-indigo-600" /> Ask Mentor
              </Button>
              <Button
                size="sm"
                onClick={() => setPostModalOpen(true)}
                className="h-8 gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs shadow-sm"
              >
                <PlusCircle className="h-3.5 w-3.5" /> Share Update
              </Button>
            </div>
          }
          description={`Active club forum moderated by faculty mentor: ${active.mentor}`}
        >
          {/* Feed Filter Badges */}
          <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3">
            {["All", "Discussion", "Showcase", "Question", "Announcement"].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFilterCategory(cat)}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer",
                  filterCategory === cat
                    ? "bg-indigo-50 font-bold text-indigo-700 ring-1 ring-indigo-200"
                    : "text-slate-600 hover:bg-slate-100",
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Posts Stream */}
          <div className="space-y-3.5">
            {filteredFeed.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No posts found in this category yet. Be the first to start a conversation!
              </div>
            ) : (
              filteredFeed.map((f) => (
                <div
                  key={f.id}
                  className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                        {f.who.substring(0, 2).toUpperCase()}
                      </div>
                      <p className="text-sm font-semibold text-slate-900">{f.who}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                          f.category === "Showcase" &&
                            "bg-emerald-50 text-emerald-700 border border-emerald-100",
                          f.category === "Question" &&
                            "bg-amber-50 text-amber-700 border border-amber-100",
                          f.category === "Announcement" &&
                            "bg-purple-50 text-purple-700 border border-purple-100",
                          f.category === "Discussion" &&
                            "bg-sky-50 text-sky-700 border border-sky-100",
                        )}
                      >
                        {f.category}
                      </span>
                      <span className="text-[11px] text-slate-400">{f.when}</span>
                    </div>
                  </div>

                  <p className="mt-2.5 text-sm text-slate-700 leading-relaxed">{f.what}</p>

                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => handleLike(f.id)}
                        className={cn(
                          "inline-flex items-center gap-1.5 text-xs font-medium transition-colors cursor-pointer",
                          f.liked
                            ? "text-rose-600 font-bold"
                            : "text-slate-500 hover:text-rose-600",
                        )}
                      >
                        <Heart className={cn("h-3.5 w-3.5", f.liked && "fill-rose-600")} />
                        <span>{f.likes}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          toast.info("Comments thread", {
                            description: "Viewing discussion thread with club members.",
                          })
                        }
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-indigo-600 cursor-pointer"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>{f.commentsCount} comments</span>
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        toast.success("Link copied", {
                          description: "Post link copied to clipboard.",
                        })
                      }
                      className="text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 pt-2">
            <Button
              variant="outline"
              onClick={() => setPostModalOpen(true)}
              className="w-full justify-start text-xs text-slate-500 hover:text-slate-900 border-dashed"
            >
              <PlusCircle className="mr-2 h-3.5 w-3.5 text-indigo-600" /> Share a project update,
              question, or code tip with {active.name}...
            </Button>
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel title="Mentor Spotlight">
            <div className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/50 to-white p-4">
              <div className="flex items-center gap-3">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white font-bold text-base shadow-sm">
                  {active.mentor
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">{active.mentor}</h4>
                  <p className="text-xs text-slate-500">Faculty Club Lead & Mentor</p>
                </div>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-slate-600">
                Holding weekly mentor office hours and code review sessions every {active.meets}.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMentorModalOpen(true)}
                className="mt-3 w-full text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50"
              >
                Send Question to Mentor
              </Button>
            </div>
          </Panel>

          <Panel title="Upcoming Club Sessions">
            <div className="space-y-2.5">
              {clubs.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2.5"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">{c.name}</p>
                    <p className="text-xs text-slate-500">{c.meets}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      toast.success("Reminder set!", { description: `${c.name} · ${c.meets}` })
                    }
                    className="text-xs font-semibold text-indigo-600 hover:underline cursor-pointer"
                  >
                    Remind me
                  </button>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>

      {/* Create Post Dialog */}
      <Dialog open={postModalOpen} onOpenChange={setPostModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Code2 className="h-5 w-5 text-indigo-600" /> Share with {active.name}
            </DialogTitle>
            <DialogDescription>
              Post an update, demo your latest project build, or spark a conversation with club
              peers.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreatePost} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="post-category">Category</Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "Discussion", label: "Discussion" },
                  { id: "Showcase", label: "Showcase" },
                  { id: "Question", label: "Doubt / Q&A" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      setPostCategory(item.id as "Showcase" | "Question" | "Discussion")
                    }
                    className={cn(
                      "rounded-lg border p-2 text-xs font-medium text-center transition-colors cursor-pointer",
                      postCategory === item.id
                        ? "border-indigo-600 bg-indigo-50 font-bold text-indigo-700 ring-1 ring-indigo-200"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50",
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="post-title">Topic / Title (Optional)</Label>
              <Input
                id="post-title"
                placeholder="e.g. Optimized my sorting algorithm or Building Pong game"
                value={postTitle}
                onChange={(e) => setPostTitle(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="post-content">Message & Code Notes</Label>
              <Textarea
                id="post-content"
                placeholder="Share your breakthrough, ask peers for feedback, or post a coding challenge..."
                rows={4}
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                required
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                id="notify-mentor"
                type="checkbox"
                checked={notifyMentor}
                onChange={(e) => setNotifyMentor(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="notify-mentor" className="text-xs text-slate-600 cursor-pointer">
                Tag club mentor <strong>{active.mentor}</strong> for review
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setPostModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
              >
                <Send className="h-3.5 w-3.5" /> Publish Post
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Ask Mentor Dialog */}
      <Dialog open={mentorModalOpen} onOpenChange={setMentorModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-indigo-600" /> Ask {active.mentor}
            </DialogTitle>
            <DialogDescription>
              Direct question to your club faculty lead. Responses appear in your club inquiry feed.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAskMentor} className="space-y-4 py-2">
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3 text-xs text-indigo-800">
              <Sparkles className="inline h-3.5 w-3.5 mr-1 text-indigo-600" />
              Mentors provide architectural guidance, debugging tips, and project direction.
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="mentor-question">Your Question or Debugging Request</Label>
              <Textarea
                id="mentor-question"
                placeholder="Describe what you are working on, what error or concept you are stuck on, and what you've tried..."
                rows={4}
                value={mentorQuestion}
                onChange={(e) => setMentorQuestion(e.target.value)}
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setMentorModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
              >
                <Send className="h-3.5 w-3.5" /> Submit to Mentor
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
