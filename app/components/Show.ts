export default function Show(props: { when: boolean; children: React.ReactNode }) {
  if (!props.when) return null;
  return props.children;
}
