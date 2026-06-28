interface NoDataFoundProps {
  title?: string;
  description?: string;
}

const NoDataFound = ({
  title = "No data found",
  description = "There is nothing to show right now.",
}: NoDataFoundProps) => {
  return (
    <div className="mx-auto p-8 text-center min-w-full">
      <img src="/no-data-found.png" alt="No data" className="mx-auto mb-4 h-24 w-24 object-contain opacity-50" />
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted">{description}</p>
    </div>
  );
};

export default NoDataFound;
