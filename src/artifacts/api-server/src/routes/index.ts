import { Router, type IRouter } from "express";
import jobsRouter from "./jobs";
import healthRouter from "./health";
import profilesRouter from "./profiles";
import catalogRouter from "./catalog";
import marketRouter from "./market";
import aiRouter from "./ai";
import enterpriseRouter from "./enterprise";
import cohortRouter from "./cohort";
import authRouter from "./auth";
import outlookRouter from "./market-outlook";

const router: IRouter = Router();

router.use(healthRouter);
router.use(jobsRouter);
router.use(authRouter);
router.use(profilesRouter);
router.use(catalogRouter);
router.use(marketRouter);
router.use(outlookRouter);
router.use(aiRouter);
router.use(cohortRouter);
router.use(enterpriseRouter);

export default router;
