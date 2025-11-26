import { Badge } from "@/components/ui/badge";
import { Link } from "react-router";

const NotFound = () => {
  return (
    <div className="p-8 text-center">
      <Badge className="mt-36 mb-4 bg-red-100 text-red-800">404</Badge>
      <h1 className="text-2xl font-bold">Page Not Found</h1>
      <p>The page you're looking for does not exist.</p>
      <Link
        to="/"
        className="mt-4 inline-block text-pink-600 underline-offset-4 hover:underline"
      >
        Go back to Home
      </Link>
    </div>
  );
};

export default NotFound;
