import FormDialog from "@/components/dialogs/FormDialog";
import CreateCategoryForm from "@/components/forms/CreateCategoryForm";
import { Button } from "@/components/ui/button";

import { useRestaurantContext } from "@/contexts/ActiveRestaurantContext";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DataTable from "@/components/DataTable";
import {
  getItemColumns,
  type Item as GetItemColumnsItem,
} from "@/components/table-columns/getItemColumns";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MenuPage = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("all");

  const { activeRestaurant } = useRestaurantContext();

  const { data: categories } = useQuery(
    trpc.category.getAllByRestaurant.queryOptions(
      {
        restaurantId: activeRestaurant?.id ?? "",
      },
      {
        enabled: !!activeRestaurant,
      },
    ),
  );

  const { data: items, isLoading: isLoadingItems } = useQuery(
    trpc.item.getAllByRestaurant.queryOptions(
      {
        restaurantId: activeRestaurant?.id ?? "",
      },
      {
        enabled: !!activeRestaurant,
      },
    ),
  );

  const filteredItems =
    activeTab === "all"
      ? items
      : items?.filter((item) => item.category_id === Number(activeTab));

  const handleEditButtonClick = (item: GetItemColumnsItem) => {
    // Implement edit functionality
    console.log("Edit item:", item);
  };
  const handleDeleteButtonClick = (item: GetItemColumnsItem) => {
    // Implement edit functionality
    console.log("Edit item:", item);
  };

  const itemColumns = getItemColumns(
    handleEditButtonClick,
    handleDeleteButtonClick,
  );

  return (
    <div>
      <div className="flex">
        <Button className="ml-auto" onClick={() => setIsDialogOpen(true)}>
          Add Item Category
        </Button>
      </div>

      <div>
        {categories?.length === 0 ? (
          <p className="text-accent-foreground mt-48 text-center">
            No categories found. Please add a category to start managing your
            items.
          </p>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <Tabs
                defaultValue="all"
                onValueChange={setActiveTab}
                className="mt-8 mb-4"
              >
                <Label htmlFor="view-selector" className="sr-only">
                  View
                </Label>
                <Select value={activeTab} onValueChange={setActiveTab}>
                  <SelectTrigger
                    className="flex w-fit lg:hidden"
                    size="sm"
                    id="view-selector"
                  >
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Items</SelectItem>
                    {categories?.map((category) => (
                      <SelectItem
                        key={category.id}
                        value={category.id.toString()}
                      >
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <TabsList className="hidden lg:flex">
                  <TabsTrigger value="all">All</TabsTrigger>
                  {categories?.map((category) => (
                    <TabsTrigger key={category.id} value={category.name}>
                      {category.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
              <Button variant={"outline"}>Add Item</Button>
            </div>
            <DataTable
              isLoading={isLoadingItems}
              columns={itemColumns}
              data={filteredItems ?? []}
            />
          </>
        )}
      </div>

      <FormDialog
        title="Add Item Category"
        description="Add a new item category to your menu. You can add items to this category later."
        isDialogOpen={isDialogOpen}
        setIsDialogOpen={setIsDialogOpen}
        formComponent={
          <CreateCategoryForm onSuccess={() => setIsDialogOpen(false)} />
        }
      />
    </div>
  );
};

export default MenuPage;
