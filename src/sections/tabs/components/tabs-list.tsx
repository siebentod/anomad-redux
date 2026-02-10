interface TabsListProps {
  tabs: string[];
  renderTab: (tab: string, index: number) => React.ReactNode;
}

export function TabsList({ tabs, renderTab }: TabsListProps) {
  return (
    <>
      {tabs.map((tab, index) => renderTab(tab, index))}
    </>
  );
}