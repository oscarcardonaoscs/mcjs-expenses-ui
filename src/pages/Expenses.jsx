import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

export default function Expenses() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["expenses"],
    queryFn: async () => (await api.get("/expenses")).data,
  });

  if (isLoading) return "Loading...";
  if (error) return "Error fetching expenses";

  return (
    <div>
      <h1>Expenses</h1>
      <ul>
        {data.items.map((e) => (
          <li key={e.id}>
            {e.date} • {e.category_name} • ${e.amount} • {e.vendor_name}
          </li>
        ))}
      </ul>
    </div>
  );
}
