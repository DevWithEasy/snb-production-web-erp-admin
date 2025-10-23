export default function getSortingmaterials(materials, productMaterials) {
  const generetedMaterials = productMaterials
    ?.map((material) => {
      const findItem = materials?.find((item) => item.id === material.id);
      return {
        ...material,
        name: findItem?.name || "Unknown Material",
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
  return generetedMaterials || [];
}
