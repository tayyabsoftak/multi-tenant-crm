export default function EmptyState({ message }: { message: string }): React.JSX.Element {
  return <div className="text-sm text-muted-foreground">{message}</div>;
}
