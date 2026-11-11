export function HeightComparison({
  personHeight,
  productHeight,
  productName,
}: {
  personHeight: number;
  productHeight: number;
  productName: string;
}) {
  const max = Math.max(personHeight, productHeight);
  return (
    <div className="height-comparison" aria-label="Perbandingan tinggi">
      <div>
        <span>Manusia</span>
        <i style={{ height: (personHeight / max) * 100 }} />
        <strong>{personHeight / 10} cm</strong>
      </div>
      <div>
        <span>{productName}</span>
        <i style={{ height: (productHeight / max) * 100 }} />
        <strong>{productHeight / 10} cm</strong>
      </div>
    </div>
  );
}
