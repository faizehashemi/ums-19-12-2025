const PageHeader = ({ title, subtitle, actions, breadcrumbs, className = '' }) => {
  return (
    <div className={`mb-6 ${className}`}>
      {breadcrumbs && (
        <nav className="mb-2 text-sm text-gray-600">
          {breadcrumbs}
        </nav>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{title}</h1>
          {subtitle && (
            <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2 flex-wrap">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
