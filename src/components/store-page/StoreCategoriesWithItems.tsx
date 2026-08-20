import { createSlug } from "@/utils/createSlug";
import { frame, motion, useMotionValue } from "motion/react";
import type { StoreCategory, StoreItem } from "@/pages/StorePage";

const activeThumbnailZIndex = 2001;
const priceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

type StoreCategoriesWithItemsProps = {
  categories: StoreCategory[] | undefined;
  onSelectItem: (item: StoreItem) => void;
  prefersReducedMotion: boolean | null;
  selectedItemId: number | null;
};

type StoreItemImageButtonProps = {
  isSelected: boolean;
  item: StoreItem;
  onSelectItem: (item: StoreItem) => void;
  prefersReducedMotion: boolean | null;
};

const StoreItemImageButton = ({
  isSelected,
  item,
  onSelectItem,
  prefersReducedMotion,
}: StoreItemImageButtonProps) => {
  const zIndex = useMotionValue(0);
  const layoutTransition = prefersReducedMotion
    ? { duration: 0.01 }
    : { type: "spring" as const, bounce: 0.1, visualDuration: 0.3 };

  if (!item.image_url) return null;

  return (
    <motion.button
      type="button"
      onClick={() => {
        frame.postRender(() => {
          onSelectItem(item);
          zIndex.set(activeThumbnailZIndex);
        });
      }}
      className="group/image shrink-0 cursor-zoom-in overflow-hidden rounded-xl focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-4 focus-visible:outline-none"
      style={{
        aspectRatio: "1 / 1",
        height: 64,
        opacity: isSelected ? 0 : 1,
        width: 64,
        zIndex,
      }}
      aria-haspopup="dialog"
      aria-label={`Open larger image for ${item.name}`}
    >
      <motion.img
        layoutId={`store-item-image-${item.id}`}
        src={item.image_url}
        alt={item.name}
        loading="lazy"
        decoding="async"
        className="object-cover"
        style={{
          aspectRatio: "1 / 1",
          borderRadius: 12,
          height: "100%",
          width: "100%",
        }}
        transition={{ layout: layoutTransition }}
        onLayoutAnimationStart={() => zIndex.set(activeThumbnailZIndex)}
        onLayoutAnimationComplete={() => zIndex.set(0)}
      />
    </motion.button>
  );
};

const StoreCategoriesWithItems = ({
  categories,
  onSelectItem,
  prefersReducedMotion,
  selectedItemId,
}: StoreCategoriesWithItemsProps) => {
  if (categories?.length === 0) {
    return <p className="mt-16 text-center">No categories available.</p>;
  }

  return categories?.map((category) => (
    <section key={category.id} className="mt-14">
      <h3
        id={createSlug(category.name)}
        className="menu-header scroll-mt-20 font-medium text-neutral-950"
      >
        {category.name}
      </h3>
      <p className="text-sm text-neutral-500">{category.description}</p>

      <ul className="mt-8 space-y-6">
        {category.items?.map((item) => {
          return (
            <li
              key={item.id}
              className="border-b border-neutral-200/50 pb-6 last:border-b-0"
            >
              <div className="block w-full rounded-md text-left">
                <div className="flex items-center justify-between gap-2">
                  <StoreItemImageButton
                    isSelected={selectedItemId === item.id}
                    item={item}
                    onSelectItem={onSelectItem}
                    prefersReducedMotion={prefersReducedMotion}
                  />
                  <div className="flex flex-1 flex-col gap-0.5 text-sm">
                    <motion.h4 className="font-medium wrap-break-word">
                      {item.name}
                    </motion.h4>

                    <p className="text-muted-foreground line-clamp-3 max-w-sm text-xs wrap-break-word">
                      {item?.description}
                    </p>
                  </div>
                  <motion.span className="shrink-0 text-xs font-medium text-neutral-700 tabular-nums">
                    {priceFormatter.format(item.price)}
                  </motion.span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  ));
};

export default StoreCategoriesWithItems;
