export default function BuffText({ additions }: { additions: string[] }) {
  return (
    <>
      {additions.map((content) => (
        <div key={content}>{content}</div>
      ))}
    </>
  );
}
