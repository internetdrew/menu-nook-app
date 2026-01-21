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

interface MenuUnavailableProps {
  placeName: string;
}

const MenuUnavailable = ({ placeName }: MenuUnavailableProps) => {
  return (
    <div>
      <Card className="mx-auto mt-44 max-w-md">
        <CardHeader>
          <CardTitle>Menu Not Available</CardTitle>
          <CardDescription>
            This <span className="font-semibold">{placeName}</span> menu is not
            available.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm">
            The menu owner needs to make their menu public before it can be
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

export default MenuUnavailable;
