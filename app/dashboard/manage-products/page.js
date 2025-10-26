"use client";
import LoadingScreen from "@/components/LoadingScreen";
import EditProductModal from "@/components/manage_products/EditProductModal";
import InfoList from "@/components/manage_products/InfoList";
import ProductList from "@/components/manage_products/ProductList";
import { useAuth } from "@/hooks/useAuth";
import Firebase from "@/utils/firebase";
import { db } from "@/utils/firebaseConfig";
import formatFieldName from "@/utils/formatedFieldName";
import getPeriodPath from "@/utils/getPeriodPath";
import { addDoc, collection, deleteDoc, doc, getDoc, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function ManageProducts() {
  const [sections, setSections] = useState([]);
  const [section, setSection] = useState(null);
  const [name, setName] = useState("");
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recipeData, setRecipeData] = useState(null);
  const [recipeInfo, setRecipeInfo] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [editName, setEditName] = useState("");
  const [info, setInfo] = useState(null);
  const [currentInfoFields, setCurrentInfoFields] = useState([]);
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldValue, setNewFieldValue] = useState("");
  const [newFields, setNewFields] = useState({});
  const [sectionLoading, setSectionLoading] = useState(false);
  const [productsView, setProductsView] = useState(true);
  const [addProductsView, setAddProductsView] = useState(false);
  const [addInfoView, setAddInfoView] = useState(false);
  const [showInfoField, setShowInfoField] = useState(false);

  // Refs and paths computed dynamically
  const periodPath = getPeriodPath(user?.current_period);
  const productCollectionName = section ? `${section}_products` : null;
  const productPeriodCollectionName = section
    ? `${section}_products_period_${periodPath}`
    : null;

  const RECIPE_INFO_COLLECTION = "recipe_info";
  const RECIPE_INFO_DOCUMENT = "info";

  // Firebase utility functions
  const createDoc = async (collectionName, data) => {
    try {
      const colRef = collection(db, collectionName);
      const docRef = await addDoc(colRef, data);
      return { id: docRef.id, ...data };
    } catch (error) {
      console.error(`Error creating document in ${collectionName}:`, error);
      throw error;
    }
  };

  const deleteDocument = async (collectionName, docId) => {
    try {
      const docRef = doc(db, collectionName, docId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error(`Error deleting document from ${collectionName}:`, error);
      throw error;
    }
  };

  const fetchSections = async () => {
    try {
      setSectionLoading(true);
      const fetchSections = await Firebase.getDocuments("sections");

      const sorted = fetchSections.sort((a, b) =>
        a.label.localeCompare(b.label)
      );

      setSections(sorted);

      if (!section && sorted.length > 0) {
        setSection(sorted[0].value);
      }
      setSectionLoading(false);
    } catch (error) {
      setSectionLoading(false);
      console.error("Failed to load sections:", error);
      alert("Failed to load sections");
    }
  };

  // Load recipe info from Firestore
  const loadRecipeInfo = async () => {
    try {
      const infoDocRef = doc(db, RECIPE_INFO_COLLECTION, section);
      const infoDoc = await getDoc(infoDocRef);

      if (infoDoc.exists()) {
        const data = infoDoc.data();
        setRecipeInfo(data);
        if (section && data) {
          setCurrentInfoFields(Object.entries(data));
          setInfo(data);
        } else {
          setCurrentInfoFields([]);
        }
        return data;
      } else {
        alert("Recipe information not found in database");
        return null;
      }
    } catch (err) {
      console.error("Error loading recipe info:", err);
      return null;
    }
  };

  // Load products for section & period from Firestore
  const loadProducts = async () => {
    if (!section) return;
    setLoading(true);
    setError(null);

    try {
      console.log("Fetching products from Firestore...");
      const products = await Firebase.getDocuments(productPeriodCollectionName);
      if (products.length === 0) {
        setError("No products found in Firestore for this section and period");
      }
      setRecipeData(products.sort((a,b)=>a.name.localeCompare(b.name)));
      console.log("Products loaded from Firestore");
    } catch (err) {
      console.error("Failed to load products:", err);
      setError("Failed to load products: " + err.message);
      setRecipeData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeInfo = (field, value) => {
    const new_info = { ...info, [field]: value.toString() };
    setInfo(new_info);
  };

  // Add new product (without UUID)
  const handleSubmit = async () => {
    if (!name.trim()) {
      return alert("Please insert product name");
    }
    if (!recipeInfo) {
      return alert("Recipe information not loaded or missing for this section");
    }
    setLoading(true);
    try {
      const newProduct = {
        name: name.toString(),
        batch: Array.from({ length: 31 }, (_, i) => ({
          date: i + 1,
          qty: 0,
        })),
        carton: Array.from({ length: 31 }, (_, i) => ({
          date: i + 1,
          qty: 0,
        })),
        rm: [],
        carton_rm: [],
        pm: [],
        carton_pm: [],
        info: info ? info :  recipeInfo,
      };

      const createdProduct = await createDoc(
        productCollectionName,
        newProduct
      );

      await Firebase.createDocWithName(
        productPeriodCollectionName,
        createdProduct.id,
        newProduct
      );

      // Update local state
      const updatedData = [...recipeData, createdProduct];
      setRecipeData(updatedData);
      setName("");
      toast.success('New product added successfully!');
    } catch (err) {
      console.error("Error adding product:", err);
      alert("Error: Could not add product: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete product by name
  const handleDeleteProduct = (product) => {
    console.log(product);
    if (window.confirm(`Are you sure you want to delete the product "${product.name}"?`)) {
      deleteProduct(product);
    }
  };

  const deleteProduct = async (product) => {
    setLoading(true);
    try {
      // Filter out product by id
      const updatedRecipies = recipeData.filter((p) => p.id !== product.id);

      // Delete product doc from Firestore period collection
      await deleteDocument(productCollectionName, product.id);
      await deleteDocument(productPeriodCollectionName, product.id);

      setRecipeData(updatedRecipies);
      alert("Success: Product deleted successfully!");
    } catch (err) {
      console.error("Error deleting product:", err);
      alert("Error: Could not delete product: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Edit product name
  const handleEditProduct = (product) => {
    setEditProduct(product);
    setEditName(product.name);
    setEditModalVisible(true);
  };

  const updateProductName = async () => {
    if (!editName.trim()) {
      return alert("Error: Product name cannot be empty");
    }
    setLoading(true);
    try {
      // Update product name in recipies array
      const updatedData = recipeData.map((product) => {
        if (product.id === editProduct.id) {
          return { ...product, name: editName };
        }
        return product;
      });

      const productCollection = doc(db, productCollectionName, editProduct.id);
      await updateDoc(productCollection, {
        name: editName,
      });

      const productPeriodCollection = doc(
        db,
        productPeriodCollectionName,
        editProduct.id
      );
      await updateDoc(productPeriodCollection, {
        name: editName,
      });

      setRecipeData(updatedData);
      setEditModalVisible(false);
      toast.success(`${editName} Updated Successfully.`);
    } catch (err) {
      console.error("Error updating product:", err);
      toast.error(`${editName} Could not update product.`);
    } finally {
      setLoading(false);
    }
  };

  const addInfoField = () => {
    if (!newFieldName.trim() || !newFieldValue.trim()) {
      alert("Error: Field name and value cannot be empty");
      return;
    }
    const field_name = newFieldName
      .trim()
      .split(" ")
      .map((c) => c.toLocaleLowerCase())
      .join("_");
    const newField = [
      field_name,
      isNaN(newFieldValue) ? newFieldValue : parseFloat(newFieldValue),
    ];

    setCurrentInfoFields([...currentInfoFields, newField]);
    setNewFieldName("");
    setNewFieldValue("");

    //new added filed
    const fields = newFields;
    setNewFields({
      ...fields,
      [field_name]: isNaN(newFieldValue)
        ? newFieldValue
        : parseFloat(newFieldValue),
    });
  };

  const removeNewInfoField = async (fieldName) => {
    try {
      const { [fieldName]: removed, ...rest } = newFields;
      setNewFields(rest);
    } catch (error) {
      console.log("Delete Field Failed" + error);
    }
  };

  const deleteInfoField = async (fieldName) => {
    try {
      //remove field
      const updatedFields = currentInfoFields.filter(
        ([name]) => name !== fieldName
      );
      //set cuttrnt field
      setCurrentInfoFields(updatedFields);

      //updated data
      const updatedInfo = { ...recipeInfo };
      updatedInfo[section] = Object.fromEntries(updatedFields);
      setRecipeInfo(updatedInfo);

      const recipeInfoDocRef = doc(
        db,
        RECIPE_INFO_COLLECTION,
        RECIPE_INFO_DOCUMENT
      );
      await updateDoc(recipeInfoDocRef, updatedInfo);

      for (const product of recipeData) {
        const { [fieldName]: removed, ...rest } = product.info;
        const productCollection = doc(db, productCollectionName, product.id);
        const productPeriodCollection = doc(
          db,
          productPeriodCollectionName,
          product.id
        );
        await updateDoc(productCollection, { info: rest });
        await updateDoc(productPeriodCollection, { info: rest });
        alert("Success: Information fields updated successfully!");
      }
    } catch (error) {
      console.log("Delete Field Failed" + error);
    }
  };

  const removeInfoField = (fieldName) => {
    if (window.confirm("It Delete The field from info and all product at this time. It cant undo.")) {
      deleteInfoField(fieldName);
    }
  };

  const updateInfoField = async () => {
    setLoading(true);
    try {
      const updatedInfo = { ...recipeInfo };
      updatedInfo[section] = Object.fromEntries(currentInfoFields);
      setRecipeInfo(updatedInfo);

      // Update Firestore recipe_info document
      const recipeInfoDocRef = doc(
        db,
        RECIPE_INFO_COLLECTION,
        RECIPE_INFO_DOCUMENT
      );
      await updateDoc(recipeInfoDocRef, updatedInfo);

      // Update all products' info in Firestore collections
      const keys = Object.keys(newFields);
      if (recipeData) {
        const updatedData = recipeData.map((product) => ({
          ...product,
          info:
            keys.length > 0
              ? { ...product.info, ...newFields }
              : { ...product.info },
        }));

        setNewFields({});
        setRecipeData(updatedData);

        updatedData.forEach(async (product) => {
          const productCollection = doc(db, productCollectionName, product.id);
          const productPeriodCollection = doc(
            db,
            productPeriodCollectionName,
            product.id
          );
          await updateDoc(productCollection, { info: product.info });
          await updateDoc(productPeriodCollection, { info: product.info });
        });

        alert("Success: Information fields updated successfully!");
      }
    } catch (err) {
      console.error("Error updating info fields:", err);
      alert("Error: Could not update information fields: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle product tap, double tap & long press (same logic)
  const [lastTap, setLastTap] = useState(null);
  const handleProductPress = (product) => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;
    if (lastTap && now - lastTap < DOUBLE_PRESS_DELAY) {
      handleEditProduct(product);
    } else {
      setLastTap(now);
      setTimeout(() => {
        if (lastTap === now) {
          handleDeleteProduct(product);
        }
      }, 500);
    }
  };

  // Load sections and recipe info on mount
  useEffect(() => {
    fetchSections();
  }, []);

  // Load products when section or period changes
  useEffect(() => {
    if (section && user?.current_period) {
      loadProducts();
      loadRecipeInfo();
    }
  }, [section, user?.current_period]);

  if (sectionLoading) {
    return <LoadingScreen />;
  }

  const isAddCheck = addProductsView || addInfoView;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Main Container */}
        <div className={`${isAddCheck ? 'bg-white border border-gray-300 rounded-lg p-4 mb-4 shadow-sm' : 'mb-4'}`}>
          
          {/* Section Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Section
            </label>
            <select
              value={section || ""}
              onChange={(e) => setSection(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              {sections.map(({ label, value }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Add Product Form */}
          {productsView && addProductsView && (
            <div>
              <button
                onClick={() => setShowInfoField(!showInfoField)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium self-end mb-4"
              >
                {showInfoField ? "Hide" : "Show"} Product Info fields
              </button>
              
              {showInfoField && info && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {Object.keys(info).map((key) => (
                    <div key={key} className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {formatFieldName(key)}
                      </label>
                      <input
                        type="text"
                        value={info[key].toString()}
                        onChange={(e) => handleChangeInfo(key, e.target.value)}
                        placeholder={key}
                        disabled={loading}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter Product name"
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setAddProductsView(false)}
                  className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium text-white ${
                    loading 
                      ? "bg-gray-400 cursor-not-allowed" 
                      : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Saving...
                    </div>
                  ) : (
                    "Submit"
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Add Info Field Form */}
          {addInfoView && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <input
                  type="text"
                  value={newFieldName}
                  onChange={(e) => setNewFieldName(e.target.value)}
                  placeholder="Field name"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="text"
                  value={newFieldValue}
                  onChange={(e) => setNewFieldValue(e.target.value)}
                  placeholder="Field value"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setAddInfoView(false)}
                  className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={addInfoField}
                  className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 font-medium"
                >
                  + Add Field
                </button>
              </div>
            </div>
          )}
        </div>

        {/* View Toggle Buttons */}
        <div className="flex mb-6 bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200">
          <button
            onClick={() => {
              setProductsView(true);
              setAddProductsView(false);
              setAddInfoView(false);
            }}
            className={`flex-1 py-3 font-medium transition-colors ${
              productsView 
                ? "bg-blue-600 text-white" 
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            Products
          </button>
          <button
            onClick={() => {
              setProductsView(false);
              setAddProductsView(false);
              setAddInfoView(false);
            }}
            className={`flex-1 py-3 font-medium transition-colors ${
              !productsView 
                ? "bg-blue-600 text-white" 
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            Info Manage
          </button>
        </div>

        {/* Products or Info List */}
        {recipeData && productsView && (
          <ProductList
            addProductsView={addProductsView}
            setAddProductsView={setAddProductsView}
            recipies={recipeData}
            handleProductPress={handleProductPress}
            handleDeleteProduct={handleDeleteProduct}
            handleEditProduct={handleEditProduct}
          />
        )}
        
        {recipeData && !productsView && (
          <InfoList
            newFields={newFields}
            updateInfoField={updateInfoField}
            loading={loading}
            currentInfoFields={currentInfoFields}
            setAddInfoView={setAddInfoView}
            addInfoView={addInfoView}
            removeInfoField={removeInfoField}
            removeNewInfoField={removeNewInfoField}
          />
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
            <div className="text-red-700 text-center">{error}</div>
          </div>
        )}

        {/* Edit Product Modal */}
        <EditProductModal
          editModalVisible={editModalVisible}
          setEditModalVisible={setEditModalVisible}
          editName={editName}
          setEditName={setEditName}
          updateProductName={updateProductName}
          loading={loading}
        />
      </div>
    </div>
  );
}