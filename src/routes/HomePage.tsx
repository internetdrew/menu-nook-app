import CategoriesCard from "@/components/home/CategoriesCard";
import ItemsCard from "@/components/home/ItemsCard";

export const HomePage = () => {
  return (
    <div>
      <main>
        <h1 className="align-center mt-4 font-medium">Home</h1>
        <p className="text-muted-foreground text-sm">
          What you're managing, at a glance.
        </p>

        <div className="my-4 grid grid-cols-1 items-start gap-4 sm:grid-cols-2 md:grid-cols-3">
          <CategoriesCard />
          <ItemsCard />
        </div>
      </main>
    </div>
  );
};
