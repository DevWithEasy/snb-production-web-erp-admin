import { FaSearch } from "react-icons/fa";

export default function SearchAndProductSelect({
  // SearchProduct props
  sections,
  section,
  setSection,
  handleFind,
  setProducts,
  setSelectProduct,
  setSelectRefProduct,

  // ProductTypeSelect props
  products,
  product,
  setProduct,
  field,
  setField,
  loadSelectMaterials,
  loading,
}) {
  const fields = [
    { label: "Raw Materials (RM)", value: "rm" },
    { label: "Packaging Materials (PM)", value: "pm" }
  ];

  return (
    <div className="mb-2">
      {/* Labels Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
        <label className="text-sm font-semibold text-gray-800 flex items-center">
          Section & Search
        </label>
        {products.length > 0 && (
          <>
            <label className="text-sm font-semibold text-gray-800 flex items-center">
              Select Product
            </label>
            <label className="text-sm font-semibold text-gray-800 flex items-center">
              Material Type
            </label>
          </>
        )}
      </div>

      {/* Inputs Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        {/* Section Select with Search Button */}
        <div className="flex">
          <div className="flex-1">
            <select
              value={section}
              onChange={(e) => {
                setSection(e.target.value);
                setProducts([]);
                setSelectProduct({});
                setSelectRefProduct({});
              }}
              className="w-full h-12 px-3 border border-gray-300 rounded-l-lg bg-white text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              {sections.map((sectionItem) => (
                <option key={sectionItem.value} value={sectionItem.value}>
                  {sectionItem.label}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleFind}
            className="flex items-center justify-center bg-blue-600 text-white h-12 w-12 border-none rounded-r-lg cursor-pointer text-sm transition-colors duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            title="Find Recipes"
          >
            <FaSearch className="text-base" />
          </button>
        </div>
        {products.length > 0 && (
          <>
            {/* Product Select */}
            <div>
              <select
                value={product}
                onChange={(e) => {
                  const selectedValue = e.target.value;
                  setProduct(selectedValue);
                  const selectedProduct = products.find(
                    (p) => p.id === selectedValue
                  );
                  setSelectProduct(selectedProduct);
                  setSelectRefProduct(selectedProduct);
                }}
                className="w-full h-12 px-3 border border-gray-300 rounded-lg bg-white text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer"
                disabled={products.length === 0}
              >
                <option value="">Select Product</option>
                {products.map((productItem) => (
                  <option key={productItem.id} value={productItem.id}>
                    {productItem.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Material Type Select */}
            <div>
              <select
                value={field}
                onChange={(e) => {
                  const selectedField = e.target.value;
                  setField(selectedField);
                  loadSelectMaterials(selectedField);
                }}
                className="w-full h-12 px-3 border border-gray-300 rounded-lg bg-white text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer"
                disabled={products.length === 0}
              >
                {fields.map((fieldItem) => (
                  <option key={fieldItem.value} value={fieldItem.value}>
                    {fieldItem.label}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
