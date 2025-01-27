interface QuantityBarProp {
  full: boolean;
}
const QuantityBar: React.FC<QuantityBarProp> = ({ full }) => {
  return <span className="bar">{full ? "[|||]" : "[___]"}</span>;
};

interface QuantityBarsProps {
  quantity: number;
}

const QuantityBars: React.FC<QuantityBarsProps> = ({ quantity }) => {
  const maxBars = 10; // Total number of bars

  // Generate the bars dynamically
  const quantityBars = Array.from({ length: maxBars }, (_, index) => {
    const isFull = quantity > index;
    return <QuantityBar key={index} full={isFull} />;
  });

  return <div className="quantity-bar">{quantityBars}</div>;
};

export default QuantityBars;
