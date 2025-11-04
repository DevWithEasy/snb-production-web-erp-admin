'use client';

import { useParams } from "next/navigation";
import { collection, doc, getDocs, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "@/utils/firebaseConfig";
import getPeriodPath from "@/utils/getPeriodPath";
import { useAuth } from "@/hooks/useAuth";
import formatNumber from "@/utils/formatNumber";
import ConsumptionSwitchView from "@/components/floor_consumption/ConsumptionSwitchView";
import ConsumptionView from "@/components/floor_consumption/ConsumptionView";
import ProductionView from "@/components/floor_consumption/ProductionView";
import { toast } from "sonner";

export default function Consumption() {
  const { user } = useAuth();
  const params = useParams();
  const section = params.name;

  const [products, setProducts] = useState(null);
  const [materials, setMaterials] = useState({ rm: [], pm: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [product, setProduct] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [consumptionView, setConsumptionView] = useState(false);
  const [consumption, setConsumption] = useState([]);
  const [updating, setUpdating] = useState(false);
  const [batch, setBatch] = useState("");
  const [carton, setCarton] = useState("");
  const [expressionErrors, setExpressionErrors] = useState({});

  const periodId = getPeriodPath(user?.current_period);

  const period_products_collection_name = `${section}_products_period_${periodId}`;
  const period_rm_collection_name = `${section}_rm_period_${periodId}`;
  const period_pm_collection_name = `${section}_pm_period_${periodId}`;

  const fetchFromFirestore = async (collectionName) => {
    try {
      const colRef = collection(db, collectionName);
      const snapshot = await getDocs(colRef);
      const dataArray = [];
      snapshot.forEach((doc) => dataArray.push({ id: doc.id, ...doc.data() }));
      return dataArray.sort((a,b)=>a.name.localeCompare(b.name));
    } catch (err) {
      console.error(`Error fetching collection ${collectionName}:`, err);
      return [];
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [recipeData, rmData, pmData] = await Promise.all([
          fetchFromFirestore(period_products_collection_name),
          fetchFromFirestore(period_rm_collection_name),
          fetchFromFirestore(period_pm_collection_name),
        ]);

        setProducts(recipeData);
        setProduct(recipeData[0] || null);
        setMaterials({ rm: rmData, pm: pmData });

        if (rmData.length === 0 && pmData.length === 0) {
          setError("No materials found for this section and period.");
        }

        console.log("Loaded all data from Firestore");
      } catch (err) {
        setError("Error fetching data: " + err.message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (section && user?.current_period) {
      fetchData();
    }
  }, [section, user?.current_period]);

  // Improved function to evaluate mathematical expressions safely and detect errors
  const evaluateExpression = (expression) => {
    if (!expression || expression === '') return { value: 0, hasError: false };
    
    try {
      // Clean the expression - allow numbers, basic operators, and decimal points
      let cleanExpression = expression.replace(/[^0-9+\-*/.()\s]/g, '');
      
      // Remove any multiple operators except for negative numbers
      cleanExpression = cleanExpression.replace(/([+\-*/])\1+/g, '$1');
      
      // Handle cases like "5+" or "10*" by removing trailing operators
      cleanExpression = cleanExpression.replace(/[+\-*/.]$/, '');
      
      // If expression is empty after cleaning, return 0
      if (!cleanExpression || cleanExpression === '') return { value: 0, hasError: false };
      
      // Check if it's just a simple number
      if (/^-?\d*\.?\d+$/.test(cleanExpression)) {
        return { value: parseFloat(cleanExpression), hasError: false };
      }
      
      // For complex expressions, use safer evaluation
      // Only evaluate if we have valid operators between numbers
      if (/^[-]?\d*\.?\d+([+\-*/][-]?\d*\.?\d+)*$/.test(cleanExpression)) {
        // Use a simple parser for basic arithmetic
        const tokens = cleanExpression.match(/([-]?\d*\.?\d+|[+\-*/])/g);
        if (!tokens) return { value: parseFloat(cleanExpression) || 0, hasError: false };
        
        let result = parseFloat(tokens[0]);
        
        for (let i = 1; i < tokens.length; i += 2) {
          const operator = tokens[i];
          const nextNum = parseFloat(tokens[i + 1]);
          
          switch (operator) {
            case '+':
              result += nextNum;
              break;
            case '-':
              result -= nextNum;
              break;
            case '*':
              result *= nextNum;
              break;
            case '/':
              if (nextNum === 0) {
                return { value: 0, hasError: true, error: "Division by zero" };
              }
              result /= nextNum;
              break;
            default:
              break;
          }
        }
        
        return { value: isNaN(result) ? 0 : result, hasError: false };
      }
      
      // If it doesn't match our safe patterns, try to parse as float
      const fallbackValue = parseFloat(cleanExpression) || 0;
      return { value: fallbackValue, hasError: fallbackValue === 0 && cleanExpression !== '0' };
      
    } catch (error) {
      console.error("Error evaluating expression:", error, "Expression:", expression);
      // Fallback: try to extract the first valid number
      const match = expression.match(/-?\d*\.?\d+/);
      const fallbackValue = match ? parseFloat(match[0]) : 0;
      return { 
        value: fallbackValue, 
        hasError: true, 
        error: "Invalid expression" 
      };
    }
  };

  // Function to check if an expression is valid
  const isValidExpression = (expression) => {
    if (!expression || expression === '') return true;
    
    const result = evaluateExpression(expression);
    return !result.hasError;
  };

  async function handleChangeSave() {
    // Check if there are any expression errors before saving
    const hasErrors = Object.values(expressionErrors).some(error => error);
    if (hasErrors) {
      alert(
        "Expression Error", 
        "Some fields contain invalid expressions. Please fix them before saving."
      );
      return;
    }

    setUpdating(true);
    try {
      const updateProducts = [];

      consumption.forEach((prod) => {
        const findProd = products.find((p) => p.id === prod.id);
        const productBatch = findProd?.batch.map((b) => {
          if (b.date.toString() === selectedDate) {
            return {
              ...b,
              qty: prod.batch || 0,
            };
          }
          return b;
        });
        const productCarton = findProd?.carton.map((b) => {
          if (b.date.toString() === selectedDate) {
            return {
              ...b,
              qty: prod.carton || 0,
            };
          }
          return b;
        });

        updateProducts.push({
          ...findProd,
          batch: productBatch,
          carton: productCarton,
        });
      });

      const consumption_rm = getItemTotals("rm").map((item) => {
        const mat = materials.rm.find((m) => m.id === item.id);
        if (mat) {
          const consumptions = mat.consumption_days.map((d) => {
            if (d.date.toString() === selectedDate) {
              return {
                ...d,
                qty: item.total,
              };
            }
            return d;
          });
          return {
            ...mat,
            consumption_days: consumptions,
          };
        }
        return mat;
      });

      const consumption_pm = getItemTotals("pm").map((item) => {
        const mat = materials.pm.find((m) => m.id === item.id);
        if (mat) {
          const consumptions = mat.consumption_days.map((d) => {
            if (d.date.toString() === selectedDate) {
              return {
                ...d,
                qty: item.total,
              };
            }
            return d;
          });
          return {
            ...mat,
            consumption_days: consumptions,
          };
        }
        return mat;
      });

      const updatedMaterials = {
        rm: materials.rm.map((m) => {
          const cons = consumption_rm.find((c) => c.id === m.id);
          return cons ? cons : m;
        }),
        pm: materials.pm.map((m) => {
          const cons = consumption_pm.find((c) => c.id === m.id);
          return cons ? cons : m;
        }),
      };

      const alUpdateProducts = products.map((product) => {
        const findUpdateProduct = updateProducts.find(
          (p) => p.id === product.id
        );
        if (findUpdateProduct) return findUpdateProduct;
        return product;
      });

      // Update local state
      setMaterials(updatedMaterials);
      setProducts(alUpdateProducts);

      // Update Firestore
      await Promise.all([
        Promise.all(
          updateProducts.map((prod) => {
            const productDocRef = doc(
              db,
              period_products_collection_name,
              prod.id
            );
            return updateDoc(productDocRef, {
              batch: prod.batch,
              carton: prod.carton,
            });
          })
        ),
        Promise.all(
          consumption_rm.map((item) => {
            const rmDocRef = doc(db, period_rm_collection_name, item.id);
            return updateDoc(rmDocRef, {
              consumption_days: item.consumption_days,
            });
          })
        ),
        Promise.all(
          consumption_pm.map((item) => {
            const pmDocRef = doc(db, period_pm_collection_name, item.id);
            return updateDoc(pmDocRef, {
              consumption_days: item.consumption_days,
            });
          })
        ),
      ]);

      setConsumption([]);
      setExpressionErrors({});
      console.log("All changes saved to Firestore successfully");
    } catch (error) {
      console.log("Error updating documents:", error);
      alert("Error", "Failed to save changes: " + error.message);
    } finally {
      setUpdating(false);
    }
  }

  function addConsumptionCalculation(batch, carton) {
    // Evaluate expressions for batch and carton
    const batchResult = evaluateExpression(String(batch));
    const cartonResult = evaluateExpression(String(carton));
    
    const batchNum = batchResult.value || 0;
    const cartonNum = cartonResult.value || 0;

    const batchRMCons =
      batchNum <= 0
        ? []
        : (product?.rm || []).map((i) => ({
            id: i.id,
            qty: formatNumber((parseFloat(i.qty) || 0) * batchNum),
            unit: i.unit,
          }));

    const cartonRMCons =
      cartonNum <= 0
        ? []
        : (product?.carton_rm || []).map((i) => ({
            id: i.id,
            qty: formatNumber((parseFloat(i.qty) || 0) * cartonNum),
            unit: i.unit,
          }));

    setConsumption((prev) => [
      ...prev,
      {
        id: product?.id,
        name: product?.name,
        batch,
        carton,
        rm: section === "dairy_milk" ? cartonRMCons : batchRMCons,
        pm:
          cartonNum <= 0
            ? []
            : (product?.carton_pm || []).map((i) => ({
                id: i.id,
                qty: formatNumber((parseFloat(i.qty) || 0) * cartonNum),
                unit: i.unit,
              })),
      },
    ]);
    setBatch("");
    setCarton("");
  }

  function addConsumption() {
    if (!product) return toast.error("No Product", "Please select a product");
    const exist = consumption.find((i) => i.id === product.id);
    if (exist)
      return toast.error("Exist", "This product is already in the list");

    if (!batch && !carton)
      return toast.error(
        "Batch and Carton Empty",
        "Batch and Carton cannot be empty"
      );

    // Check for expression errors in batch and carton
    const batchHasError = !isValidExpression(batch);
    const cartonHasError = !isValidExpression(carton);
    
    if (batchHasError || cartonHasError) {
      alert(
        "Invalid Expression",
        "Please fix the mathematical expressions in batch or carton fields."
      );
      return;
    }

    if (!batch || !carton) {
      return alert(
        !batch ? "Batch Empty" : "Carton Empty",
        `${
          !batch ? "Batch" : "Carton"
        } input is empty.Are you are only want to ${
          !batch ? "Batch" : "Carton"
        } consumption`,
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Submit",
            onPress: () => {
              addConsumptionCalculation(batch, carton);
            },
          },
        ]
      );
    }

    addConsumptionCalculation(batch, carton);
  }

  // Enhanced handleValueChange to support mathematical operations and track errors
  function handleValueChange(type, itemId, prodIdx, value) {
    // Update expression errors
    const errorKey = `${type}-${itemId}-${prodIdx}`;
    const hasError = !isValidExpression(value);
    
    setExpressionErrors(prev => ({
      ...prev,
      [errorKey]: hasError
    }));

    setConsumption((prev) => {
      const updated = prev.map((prod, idx) => {
        if (idx !== prodIdx) return prod;
        return {
          ...prod,
          [type]: prod[type].map((item) =>
            item.id === itemId ? { ...item, qty: value } : item
          ),
        };
      });
      return updated;
    });
  }

  // Updated getItemTotals to evaluate mathematical expressions
  function getItemTotals(type) {
    const itemMap = {};
    consumption.forEach((product, prodIdx) => {
      product[type].forEach((item) => {
        if (!itemMap[item.id]) {
          itemMap[item.id] = {
            id: item.id,
            unit: item.unit,
            totals: Array(consumption.length).fill(0),
          };
        }
        // Evaluate mathematical expression instead of simple parsing
        const evaluatedResult = evaluateExpression(item.qty);
        itemMap[item.id].totals[prodIdx] += isNaN(evaluatedResult.value) ? 0 : evaluatedResult.value;
      });
    });
    // compute total
    Object.values(itemMap).forEach((item) => {
      item.total = item.totals.reduce((a, b) => a + b, 0);
    });
    return Object.values(itemMap);
  }

  // Function to check if a specific field has expression error
  const hasExpressionError = (type, itemId, prodIdx) => {
    const errorKey = `${type}-${itemId}-${prodIdx}`;
    return expressionErrors[errorKey] || false;
  };

  function getItemName(field, id) {
    const findMaterials = field === "rm" ? materials?.rm : materials?.pm;
    const item = findMaterials.find((m) => m.id === id);
    return item ? item?.name : id;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading products and materials...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }

  const sectionName = section.charAt(0).toUpperCase() + section.slice(1);

  return (
    <div className="min-h-screen bg-gray-50">
       <div className="container mx-auto md:p-6 lg:p-8 pb-16 md:pb-0">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {sectionName} Consumption
          </h1>
          <p className="text-gray-600 mt-2">
            Manage production and consumption data
          </p>
        </div>

        {/* Switch View */}
        <ConsumptionSwitchView
          consumptionView={consumptionView}
          setConsumptionView={setConsumptionView}
        />

        {/* Main Content */}
        {!consumptionView ? (
          <ProductionView
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            user={user}
            handleChangeSave={handleChangeSave}
            products={products}
            product={product}
            setProduct={setProduct}
            batch={batch}
            setBatch={setBatch}
            carton={carton}
            setCarton={setCarton}
            addConsumption={addConsumption}
            consumption={consumption}
            setConsumption={setConsumption}
            updating={updating}
          />
        ) : (
          <ConsumptionView
            consumption={consumption}
            getItemTotals={getItemTotals}
            getItemName={getItemName}
            handleValueChange={handleValueChange}
            hasExpressionError={hasExpressionError}
          />
        )}
      </div>
    </div>
  );
}