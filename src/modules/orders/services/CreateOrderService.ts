import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,

    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,

    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    // Criar order
    const customer = await this.customersRepository.findById(customer_id);

    if (!customer) {
      throw new AppError('customer not found');
    }

    const productsFinded = await this.productsRepository.findAllById(products);

    const productsToCreate = products.map(product => {
      const productDB = productsFinded.find(pro => pro.id === product.id);

      if (!productDB) {
        throw new AppError('Produtct not Found');
      }

      if (productDB.quantity < product.quantity) {
        throw new AppError('Insuficient product amount');
      }

      return {
        product_id: product.id,
        quantity: product.quantity,
        price: productDB.price,
      };
    });

    const order = await this.ordersRepository.create({
      customer,
      products: productsToCreate,
    });

    await this.productsRepository.updateQuantity(products);

    return order;
  }
}

export default CreateOrderService;
