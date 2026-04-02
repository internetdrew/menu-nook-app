const BusinessLogo = ({
  imageUrl,
  businessName,
}: {
  imageUrl: string;
  businessName: string;
}) => {
  return (
    <div className="mx-auto mb-5 w-full max-w-48 p-4">
      <div className="flex aspect-[3/2] items-center justify-center">
        <img
          src={imageUrl}
          alt={`${businessName} logo`}
          className="h-full w-full object-contain"
        />
      </div>
    </div>
  );
};

export default BusinessLogo;
