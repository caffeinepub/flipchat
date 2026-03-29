export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-3 bg-received-bubble rounded-2xl rounded-bl-sm w-fit">
      <span className="typing-dot w-2 h-2 rounded-full bg-muted-foreground inline-block" />
      <span className="typing-dot w-2 h-2 rounded-full bg-muted-foreground inline-block" />
      <span className="typing-dot w-2 h-2 rounded-full bg-muted-foreground inline-block" />
    </div>
  );
}
