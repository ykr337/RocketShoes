import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const productExists = cart.find((product) => product.id === productId);
      let newCart = [...cart] as Product[];

      if (productExists) {
        updateProductAmount({
          productId: productExists.id,
          amount: productExists.amount + 1,
        });
      } else {
        const { data } = await api.get("/products/" + productId);
        if (data) {
          newCart.push({
            id: data.id,
            amount: 1,
            image: data.image,
            price: data.price,
            title: data.title,
          });
          setCart(newCart);
          localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
        } else {
        }
      }
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const newCart = cart.filter((product) => product.id !== productId);
      if (newCart.length === cart.length) {
        throw Error("Produto inexistente");
      }
      setCart(newCart);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount > 0) {
        const { data } = await api.get("/stock/" + productId);
        if (data.amount < amount) {
          toast.error("Quantidade solicitada fora de estoque");
        } else {
          const newCart = [...cart];
          newCart.forEach((product) => {
            if (product.id === productId) {
              product.amount = amount;
            }
          });
          setCart(newCart);
          localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
        }
      }
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
