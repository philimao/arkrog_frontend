import { Tabs } from "@heroui/tabs";
import { Button, Card, CardBody, Form, Input, Tab } from "@heroui/react";
import React, { type FormEvent } from "react";
import { _post } from "~/utils/tools";
import { toast } from "react-toastify";

export default function Sponsorship() {
  async function handleSubmit(evt: FormEvent<HTMLFormElement>) {
    evt.preventDefault();
    const data = Object.fromEntries(
      new FormData(evt.currentTarget as HTMLFormElement),
    );
    try {
      await _post("/user/sponsor", data);
      toast.info("感谢您对影语集的支持！");
    } catch (err) {
      toast.warning((err as Error).message);
    }
  }

  return (
    <div className="container">
      <h1 className="text-[1.5rem] font-bold mb-4">赞助我们</h1>
      <div className="mb-4">
        <span className="font-bold text-ak-blue">影语集</span>
        是一个非盈利项目，旨在为全体集成战略玩家提供优质的攻略参考与学习资源。
        <br />
        如果希望赞助我们的活动，可以扫描下方的二维码赞助我们，转账时请备注
        <span className="font-bold text-ak-blue">影语集</span>
      </div>
      <div className="block sm:flex">
        <div className="flex flex-col me-0 sm:me-4">
          <Tabs
            aria-label="Options"
            classNames={{ base: "flex justify-center" }}
          >
            <Tab key="支付宝" title="支付宝">
              <Card className="w-full sm:w-64">
                <CardBody>
                  <img
                    src={`${import.meta.env.VITE_API_BASE_URL}/images/qr-code/alipay.png`}
                    alt=""
                  />
                </CardBody>
              </Card>
            </Tab>
            <Tab key="微信" title="微信">
              <Card className="w-full sm:w-64">
                <CardBody>
                  <img
                    src={`${import.meta.env.VITE_API_BASE_URL}/images/qr-code/wechat.png`}
                    alt=""
                  />
                </CardBody>
              </Card>
            </Tab>
            <Tab key="QQ" title="QQ">
              <Card className="w-full sm:w-64">
                <CardBody>
                  <img
                    src={`${import.meta.env.VITE_API_BASE_URL}/images/qr-code/qq.png`}
                    alt=""
                  />
                </CardBody>
              </Card>
            </Tab>
          </Tabs>
        </div>
        <div className="p-2 h-full w-full">
          <div className="bg-semi-black p-2 flex-grow rounded-2xl">
            <Form
              className="flex flex-col gap-2 px-4 mb-4"
              onSubmit={handleSubmit}
            >
              <div className="mt-4">
                赞助后请留下您的留言，我们随后将会在该页展示
              </div>
              <Input
                name="username"
                label="您的昵称"
                labelPlacement="outside"
              />
              <Input name="message" label="留言" labelPlacement="outside" />
              <Button type="submit" className="bg-ak-deep-blue w-full mt-4">
                提交
              </Button>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}
