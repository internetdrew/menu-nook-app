import CategoriesCard from "@/components/home/CategoriesCard";
import ItemsCard from "@/components/home/ItemsCard";
import ShareQRButtonDialog from "@/components/home/ShareQRButtonDialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Info } from "lucide-react";

export const HomePage = () => {
  return (
    <div>
      <main>
        <div className="my-4 flex items-center">
          <h1 className="font-medium">Home</h1>
          <Popover>
            <PopoverTrigger>
              <Info className="ml-1 size-3" />
            </PopoverTrigger>
            <PopoverContent className="text-sm">
              What you're managing, at a glance.
            </PopoverContent>
          </Popover>
          <ShareQRButtonDialog />
        </div>

        <div className="my-4 grid grid-cols-1 items-start gap-4 sm:grid-cols-2 md:grid-cols-3">
          <CategoriesCard />
          <ItemsCard />
        </div>
      </main>
    </div>
  );
};
