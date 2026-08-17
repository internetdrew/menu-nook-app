import { Badge } from "@/components/ui/badge";
import { Link } from "react-router";

interface NotFoundProps {
  title: string;
  message: string;
  href: string;
  hrefText: string;
}

export const NotFound = ({ title, message, href, hrefText }: NotFoundProps) => {
  return (
    <div className="p-8 text-center">
      <Badge className="mt-36 mb-4 bg-red-100 text-red-800">404</Badge>
      <h1 className="text-2xl font-bold">{title}</h1>
      <p>{message}</p>
      <Link
        to={href}
        className="mt-4 inline-block text-pink-600 underline-offset-4 hover:underline"
      >
        {hrefText}
      </Link>
    </div>
  );
};
