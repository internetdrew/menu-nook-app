import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CircleAlert } from "lucide-react";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { linkClasses } from "@/constants";

interface StoreUnavailableProps {
  storeName: string;
}

const StoreUnavailable = ({ storeName }: StoreUnavailableProps) => {
  return (
    <div>
      <Card className="mx-auto mt-44 max-w-md">
        <CardHeader>
          <CardTitle>Store Not Available</CardTitle>
          <CardDescription>
            <span className="font-semibold">{storeName}</span> is not available.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm">
            The store owner needs to make their food page public before it can be
            viewed.
          </p>
          <Item variant="outline" className="mt-6">
            <ItemMedia variant="icon">
              <CircleAlert />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>Are you the account owner?</ItemTitle>
              <ItemDescription>
                Update your subscription to go live.
              </ItemDescription>
            </ItemContent>
          </Item>
        </CardContent>
        <CardFooter>
          <div className="text-muted-foreground mx-auto text-center text-xs">
            <span>
              Powered by{" "}
              <a href="https://menunook.com" className={linkClasses}>
                MenuNook
              </a>
            </span>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default StoreUnavailable;
